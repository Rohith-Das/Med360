import { injectable, inject } from "tsyringe";
import { IAppointmentRepository } from "../../domain/repositories/AppointmentRepository";
import { getSocketServer } from "../../infrastructure/socket/socketServer";
import { NotificationService } from "../notification/NotificationService";
import { IDoctorRepository } from "../../domain/repositories/DoctorRepository-method";
import { IPatientRepository } from "../../domain/repositories/patientRepository_method";

export interface VideoCallSession {
  roomId: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  status: "waiting" | "active" | "ended";
  startedAt?: Date;
  endedAt?: Date;
  initiatedBy: 'doctor' | 'patient';
}

@injectable()
export class VideoCallUseCase {
  private activeSession = new Map<string, VideoCallSession>();

  constructor(
    @inject("IAppointmentRepository")
    private appointmentRepo: IAppointmentRepository,
    @inject(NotificationService) private notificationService: NotificationService,
    @inject("IPatientRepository") private patientRepo: IPatientRepository,
    @inject("IDoctorRepository") private doctorRepo: IDoctorRepository
  ) {}

  async initiateCall(
    appointmentId: string,
    initiatorId: string,
    initiatorRole: "doctor" | "patient"
  ): Promise<VideoCallSession> {
    const appointment = await this.appointmentRepo.findById(appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Authorization check
    // const isAuth =
    //   (initiatorRole === "doctor" && appointment.doctorId === initiatorId) ||
    //   (initiatorRole === "patient" && appointment.patientId === initiatorId);
    // if (!isAuth) {
    //   throw new Error("Unauthorized to initiate call for this appointment");
    // }

    if (appointment.status !== "confirmed") {
      throw new Error("Appointment must be confirmed to start video call");
    }

    // Check for existing session
    const existingSession = Array.from(this.activeSession.values())
      .find(session => session.appointmentId === appointmentId && session.status !== 'ended');
    if (existingSession) {
      return existingSession;
    }
   
    const roomId = `appointment_${appointmentId}_${Date.now()}`;

    const session: VideoCallSession = {
      roomId,
      appointmentId: appointmentId.toString(),
      doctorId: appointment.doctorId.toString(),
      patientId: appointment.patientId.toString(),
      status: "waiting",
      startedAt: new Date(),
      initiatedBy: initiatorRole
    };
    this.activeSession.set(roomId, session);

    // Fetch names
    let initiatorName = "";
    if (initiatorRole === "doctor") {
      const doctor = await this.doctorRepo.findById(appointment.doctorId.toString());
      initiatorName = doctor ? doctor.name : "Doctor";
    } else {
      const patient = await this.patientRepo.findById(appointment.patientId.toString());
      initiatorName = patient ? patient.name : "Patient";
    }

    // Notify recipient via Socket.IO
    const socketServer = getSocketServer();
    const callData = {
      roomId,
      appointmentId,
      initiatorRole,
      initiatorId,
      callType: "video",
      appointmentTime: `${appointment.startTime}-${appointment.endTime}`,
      appointmentDate: appointment.date,
      initiatorName
    };
    
    const recipientId =
      initiatorRole === "doctor"
        ? appointment.patientId.toString()
        : appointment.doctorId.toString();

    socketServer.sendIncomingCallNotification(recipientId, callData);

    // Create persistent notification
    await this.notificationService.createVideoCallNotification({
      appointmentId,
      recipientId,
      initiatorId,
      initiatorRole,
      initiatorName,
      roomId,
      type: "video_call_initiated",
      title: `${initiatorRole === "doctor" ? "Dr. " : ""}${initiatorName} wants to start a video call`,
      message: `Join the video call for your appointment on ${appointment.date}`,
      data: {
        appointmentDate: appointment.date.toISOString().split("T")[0],
        appointmentTime: `${appointment.startTime}-${appointment.endTime}`,
      },
    });

    return session;
  }

  async joinCall(roomId: string, userId: string): Promise<VideoCallSession | null> {
    const session = this.activeSession.get(roomId);
    if (!session) {
      throw new Error("Video call session not found");
    }
    if (session.doctorId !== userId && session.patientId !== userId) {
      throw new Error("Unauthorized to join this video call");
    }
    session.status = "active";
    this.activeSession.set(roomId, session);
    // Notify successful join
    const socketServer = getSocketServer();
    const otherUserId = session.doctorId === userId ? session.patientId : session.doctorId;

    socketServer.sendToUser(otherUserId, 'call_participant_joined', {
      roomId,
      userId,
      status: 'active'
    });
     console.log(`User ${userId} joined video call ${roomId}`);
    return session;
  }

  async endCall(roomId: string, userId: string): Promise<boolean> {
    const session = this.activeSession.get(roomId);
    if (!session) {
      return false;
    }
    if (session.doctorId !== userId && session.patientId !== userId) {
      throw new Error("Unauthorized to end this video call");
    }

    session.status = "ended";
    session.endedAt = new Date();

    const socketServer = getSocketServer();
    const otherUserId = session.doctorId === userId ? session.patientId : session.doctorId;

    socketServer.sendCallEndNotification(otherUserId, {
      roomId,
      endedBy: userId,
      reason: "ended_by_user",
    });

    // Fetch initiator name for notification
    let initiatorName = "";
    let initiatorRole: "doctor" | "patient" = "doctor";
    if (session.doctorId === userId) {
      initiatorRole = "doctor";
      const doctor = await this.doctorRepo.findById(userId);
      initiatorName = doctor ? doctor.name : "Doctor";
    } else {
      initiatorRole = "patient";
      const patient = await this.patientRepo.findById(userId);
      initiatorName = patient ? patient.name : "Patient";
    }

    const duration = session.endedAt.getTime() - session.startedAt!.getTime(); // ms to seconds
    await this.notificationService.createVideoCallNotification({
      appointmentId: session.appointmentId,
      recipientId: otherUserId,
      initiatorId: userId,
      initiatorRole,
      initiatorName,
      roomId,
      type: "video_call_ended",
      title: "Video call ended",
      message: "The video call for your appointment has ended.",
      data: {
        appointmentDate: session.startedAt?.toISOString().split("T")[0] || "",
        appointmentTime: `${session.startedAt?.toLocaleTimeString()} - ${session.endedAt?.toLocaleTimeString()}`,
        duration: Math.floor(duration / 1000),
      },
    });

    setTimeout(() => {
      this.activeSession.delete(roomId);
    }, 5 * 60 * 1000);

    return true;
  }

  getActiveSession(roomId: string): VideoCallSession | null {
    return this.activeSession.get(roomId) || null;
  }

  getSessionByUser(userId: string): VideoCallSession[] {
    return Array.from(this.activeSession.values()).filter(
      (session) => session.doctorId === userId || session.patientId === userId
    );
  }
}