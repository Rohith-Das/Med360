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
    const isAuth =
      (initiatorRole === "doctor" && appointment.doctorId.toString() === initiatorId) ||
      (initiatorRole === "patient" && appointment.patientId.toString() === initiatorId);
    if (!isAuth) {
      throw new Error("Unauthorized to initiate call for this appointment");
    }

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

    // Fetch names for both doctor and patient
    const doctor = await this.doctorRepo.findById(appointment.doctorId.toString());
    const patient = await this.patientRepo.findById(appointment.patientId.toString());
    
    const initiatorName = initiatorRole === "doctor" 
      ? doctor?.name || "Doctor"
      : patient?.name || "Patient";

    // Enhanced socket notification with complete data
    const socketServer = getSocketServer();
    const callData = {
      roomId,
      appointmentId,
      initiatorRole,
      initiatorId,
      initiatorName,
      callType: "video",
      appointmentTime: `${appointment.startTime}-${appointment.endTime}`,
      appointmentDate: appointment.date.toISOString().split("T")[0], // Ensure proper date format
      patientName: patient?.name || "Patient",
      doctorName: doctor?.name || "Doctor"
    };
    
    const recipientId = initiatorRole === "doctor"
      ? appointment.patientId.toString()
      : appointment.doctorId.toString();

    console.log(`🚀 Initiating call - sending to ${initiatorRole === "doctor" ? "patient" : "doctor"}: ${recipientId}`);
    console.log(`📞 Call data:`, callData);

    // Send socket notification
    const socketSent = socketServer.sendIncomingCallNotification(recipientId, callData);
    console.log(`📡 Socket notification sent: ${socketSent}`);

    // Create enhanced persistent notification with roomId
    await this.notificationService.createVideoCallNotification({
      appointmentId,
      recipientId,
      initiatorId,
      initiatorRole,
      initiatorName,
      roomId, // Include roomId in notification
      type: "video_call_initiated",
      title: `${initiatorRole === "doctor" ? "Dr. " : ""}${initiatorName} wants to start a video call`,
      message: `Join the video call for your appointment on ${appointment.date.toISOString().split("T")[0]}`,
      data: {
        appointmentId,
        roomId, // CRITICAL: Include roomId in notification data
        appointmentDate: appointment.date.toISOString().split("T")[0],
        appointmentTime: `${appointment.startTime}-${appointment.endTime}`,
        doctorName: doctor?.name,
        patientName: patient?.name,
        initiatorRole,
        initiatorName
      },
    });

    console.log(`✅ Video call initiated successfully. Room: ${roomId}`);
    return session;
  }

  async joinCall(roomId: string, userId: string): Promise<VideoCallSession | null> {
    const session = this.activeSession.get(roomId);
    if (!session) {
      throw new Error("Video call session not found");
    }
    
    // Authorization check
    if (session.doctorId !== userId && session.patientId !== userId) {
      throw new Error("Unauthorized to join this video call");
    }

    // Update session status
    session.status = "active";
    this.activeSession.set(roomId, session);

    // Get user information
    const isDoctor = session.doctorId === userId;
    const userData = isDoctor
      ? await this.doctorRepo.findById(userId)
      : await this.patientRepo.findById(userId);
    const userName = userData?.name || (isDoctor ? 'Doctor' : 'Patient');
    const userRole = isDoctor ? 'doctor' : 'patient';

    // Notify via socket
    const socketServer = getSocketServer();
    const otherUserId = isDoctor ? session.patientId : session.doctorId;

    // Send join confirmation to the other participant
    socketServer.sendToUser(otherUserId, 'call_participant_joined', {
      roomId,
      userId,
      userName,
      userRole,
      socketId: socketServer.getSocketId(userId),
      status: 'active',
    });

    // Get participant information for room update
    const doctorData = await this.doctorRepo.findById(session.doctorId);
    const patientData = await this.patientRepo.findById(session.patientId);

    // Send room participants update to all participants in the room
    socketServer.sendToRoom(roomId, 'video:room-participants', {
      roomId,
      participants: [
        {
          userId: session.doctorId,
          userName: doctorData?.name || 'Doctor',
          socketId: socketServer.getSocketId(session.doctorId),
          userRole: 'doctor'
        },
        {
          userId: session.patientId,
          userName: patientData?.name || 'Patient',
          socketId: socketServer.getSocketId(session.patientId),
          userRole: 'patient'
        }
      ].filter(p => p.socketId), // Only include connected participants
      participantsCount: 2
    });

    console.log(`✅ User ${userName} (${userRole}) joined video call ${roomId}`);
    return session;
  }

  async endCall(roomId: string, userId: string): Promise<boolean> {
    const session = this.activeSession.get(roomId);
    if (!session) {
      return false;
    }
    
    // Authorization check
    if (session.doctorId !== userId && session.patientId !== userId) {
      throw new Error("Unauthorized to end this video call");
    }

    // Update session
    session.status = "ended";
    session.endedAt = new Date();

    const socketServer = getSocketServer();
    const otherUserId = session.doctorId === userId ? session.patientId : session.doctorId;

    // Notify about call end
    socketServer.sendCallEndNotification(otherUserId, {
      roomId,
      endedBy: userId,
      reason: "ended_by_user",
    });

    // Broadcast to room that call ended
    socketServer.sendToRoom(roomId, 'video:call-ended', {
      roomId,
      endedBy: userId,
      endedAt: session.endedAt
    });

    // Get user information for notification
    const isDoctor = session.doctorId === userId;
    const userData = isDoctor
      ? await this.doctorRepo.findById(userId)
      : await this.patientRepo.findById(userId);
    
    const initiatorName = userData?.name || (isDoctor ? "Doctor" : "Patient");
    const initiatorRole: "doctor" | "patient" = isDoctor ? "doctor" : "patient";

    // Create end notification
    const duration = session.startedAt 
      ? Math.floor((session.endedAt.getTime() - session.startedAt.getTime()) / 1000)
      : 0;

    await this.notificationService.createVideoCallNotification({
      appointmentId: session.appointmentId,
      recipientId: otherUserId,
      initiatorId: userId,
      initiatorRole,
      initiatorName,
      roomId,
      type: "video_call_ended",
      title: "Video call ended",
      message: `The video call with ${initiatorName} has ended.`,
      data: {
        appointmentId: session.appointmentId,
        roomId,
        appointmentDate: session.startedAt?.toISOString().split("T")[0] || "",
        appointmentTime: `${session.startedAt?.toLocaleTimeString()} - ${session.endedAt?.toLocaleTimeString()}`,
        duration: duration,
        endedBy: initiatorName
      },
    });

    // Clean up session after 5 minutes
    setTimeout(() => {
      this.activeSession.delete(roomId);
      console.log(`🧹 Cleaned up session for room: ${roomId}`);
    }, 5 * 60 * 1000);

    console.log(`❌ Video call ended by ${initiatorName} in room: ${roomId}`);
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

  // Additional helper methods
  
  getAllActiveSessions(): VideoCallSession[] {
    return Array.from(this.activeSession.values());
  }

  isUserInCall(userId: string): boolean {
    return Array.from(this.activeSession.values()).some(
      session => (session.doctorId === userId || session.patientId === userId) && 
                 session.status === 'active'
    );
  }

  getSessionByAppointment(appointmentId: string): VideoCallSession | null {
    return Array.from(this.activeSession.values()).find(
      session => session.appointmentId === appointmentId && session.status !== 'ended'
    ) || null;
  }
}