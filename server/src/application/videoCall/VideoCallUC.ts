// src/application/videoCall/VideoCallUC.ts
import { injectable, inject } from "tsyringe";
import { IAppointmentRepository } from "../../domain/repositories/AppointmentRepository";
import { getSocketServer } from "../../infrastructure/socket/socketServer";
import { NotificationService } from "../notification/NotificationService";
import { IDoctorRepository } from "../../domain/repositories/DoctorRepository-method";
import { IPatientRepository } from "../../domain/repositories/patientRepository_method";
import { VideoCallSessionModel } from "../../infrastructure/database/models/VideoCallSessionModel";
import { RedisService } from "../../infrastructure/services/RedisService";

export interface VideoCallSession {
  roomId: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  status: "waiting" | "active" | "ended";
  startedAt?: Date;
  endedAt?: Date;
  initiatedBy: 'doctor' | 'patient';
  doctorName?: string;
  patientName?: string;
  durationSeconds?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

@injectable()
export class VideoCallUseCase {
  constructor(
    @inject("IAppointmentRepository")
    private appointmentRepo: IAppointmentRepository,
    @inject(NotificationService) private notificationService: NotificationService,
    @inject("IPatientRepository") private patientRepo: IPatientRepository,
    @inject("IDoctorRepository") private doctorRepo: IDoctorRepository,
    @inject(RedisService) private redisService: RedisService
  ) {}

  // Redis-backed session helpers
  private async getSession(roomId: string): Promise<VideoCallSession | null> {
    return await this.redisService.getVideoCallSession(roomId);
  }

  private async setSession(session: VideoCallSession): Promise<void> {
    await this.redisService.setVideoCallSession(session.roomId, session);
  }

  private async deleteSession(roomId: string): Promise<void> {
    await this.redisService.deleteVideoCallSession(roomId);
  }

  // Single source of truth — used internally AND externally
  private async getAllActiveSessions(): Promise<VideoCallSession[]> {
    return await this.redisService.getAllActiveVideoCallSessions();
  }

  // Public method (now correctly implemented)
  public async getAllActiveVideoCallSessions(): Promise<VideoCallSession[]> {
    return this.getAllActiveSessions();
  }

  async initiateCall(
    appointmentId: string,
    initiatorId: string,
    initiatorRole: "doctor" | "patient"
  ): Promise<VideoCallSession> {
    const appointment = await this.appointmentRepo.findById(appointmentId);
    if (!appointment) throw new Error("Appointment not found");

    const isAuth =
      (initiatorRole === "doctor" && appointment.doctorId.toString() === initiatorId) ||
      (initiatorRole === "patient" && appointment.patientId.toString() === initiatorId);
    if (!isAuth) throw new Error("Unauthorized to initiate call");
    if (appointment.status !== "confirmed") {
      throw new Error("Appointment must be confirmed to start video call");
    }

    // Check existing session via Redis
    const existingSession = (await this.getAllActiveSessions()).find(
      s => s.appointmentId === appointmentId
    );
    if (existingSession) {
      console.log(`Reusing existing session: ${existingSession.roomId}`);
      return existingSession;
    }

    const roomId = `video-room-${appointmentId}-${Date.now()}`;
    const doctor = await this.doctorRepo.findById(appointment.doctorId.toString());
    const patient = await this.patientRepo.findById(appointment.patientId.toString());
    if (!doctor || !patient) throw new Error("Doctor or patient not found");

    const session: VideoCallSession = {
      roomId,
      appointmentId: appointmentId.toString(),
      doctorId: appointment.doctorId.toString(),
      patientId: appointment.patientId.toString(),
      status: "waiting",
      startedAt: new Date(),
      initiatedBy: initiatorRole,
      doctorName: doctor.name,
      patientName: patient.name,
    };

    await VideoCallSessionModel.create(session);
    await this.setSession(session);

    console.log(`New video call initiated: ${roomId}`);

    const recipientId = initiatorRole === "doctor" ? session.patientId : session.doctorId;
    const initiatorName = initiatorRole === "doctor" ? doctor.name : patient.name;

    const callData = {
      roomId,
      appointmentId,
      initiatorRole,
      initiatorId,
      initiatorName,
      callType: "video",
      appointmentTime: `${appointment.startTime}-${appointment.endTime}`,
      appointmentDate: appointment.date.toISOString().split("T")[0],
      patientName: patient.name,
      doctorName: doctor.name,
      status: "waiting",
      timestamp: new Date().toISOString()
    };

    const socketServer = getSocketServer();
    const sent = initiatorRole === "doctor"
      ? await socketServer.sendToPatient(recipientId, "incoming_video_call", callData)
      : await socketServer.sendToDoctor(recipientId, "incoming_video_call", callData);

    if (!sent) console.warn(`User ${recipientId} offline – relying on push notification`);

    await this.notificationService.createVideoCallNotification({
      appointmentId,
      recipientId,
      initiatorId,
      initiatorRole,
      initiatorName,
      roomId,
      type: "video_call_initiated",
      title: "Incoming Video Call",
      message: `${initiatorRole === "doctor" ? "Dr. " : ""}${initiatorName} is calling`,
      data: callData,
    });

    return session;
  }

  async joinCall(roomId: string, userId: string): Promise<VideoCallSession> {
    const session = await this.getSession(roomId);
    if (!session) throw new Error("Video call session not found or expired");

    const isDoctor = session.doctorId === userId;
    const isPatient = session.patientId === userId;
    if (!isDoctor && !isPatient) throw new Error("Unauthorized to join this call");

    const user = isDoctor
      ? await this.doctorRepo.findById(userId)
      : await this.patientRepo.findById(userId);
    const userName = user?.name || (isDoctor ? "Doctor" : "Patient");
    const userRole = isDoctor ? "doctor" : "patient";

    if (session.status === "waiting") {
      session.status = "active";
      await VideoCallSessionModel.updateOne({ roomId }, { status: "active" });
      await this.setSession(session);
    }

    getSocketServer().sendToRoom(roomId, "video:participant-joined", {
      userId,
      userName,
      userRole,
      participantsCount: 2
    });

    console.log(`${userName} joined video call ${roomId}`);
    return session;
  }

async endCall(roomId: string, userId: string): Promise<boolean> {
  const session = await this.getSession(roomId);
  if (!session) return false;

  if (session.doctorId !== userId && session.patientId !== userId) {
    throw new Error("Unauthorized");
  }

  const isDoctor = session.doctorId === userId;
  const user = isDoctor
    ? await this.doctorRepo.findById(userId)
    : await this.patientRepo.findById(userId);

  const userName = user?.name || "User";

  // ✅ Ensure startedAt always exists (Redis safety)
  if (!session.startedAt) {
    session.startedAt = new Date();
  }

  // ✅ Set end state
  session.status = "ended";
  session.endedAt = new Date();

  // ✅ Safe duration calculation
  session.durationSeconds = Math.floor(
    (session.endedAt.getTime() - new Date(session.startedAt).getTime()) / 1000
  );

  // ✅ Save to MongoDB
  await VideoCallSessionModel.updateOne(
    { roomId },
    {
      status: "ended",
      endedAt: session.endedAt,
      durationSeconds: session.durationSeconds,
    }
  );

  // ✅ Update Redis briefly
  await this.setSession(session);

  const duration = session.durationSeconds;

  // ✅ Socket notify
  getSocketServer().sendToRoom(roomId, "video:call-ended", {
    roomId,
    endedBy: userId,
    endedByName: userName,
    duration,
  });

  const recipientId = isDoctor ? session.patientId : session.doctorId;

  // ✅ Notification
  await this.notificationService.createVideoCallNotification({
    appointmentId: session.appointmentId,
    recipientId,
    initiatorId: userId,
    initiatorRole: isDoctor ? "doctor" : "patient",
    initiatorName: userName,
    roomId,
    type: "video_call_ended",
    title: "Call Ended",
    message: `Call with ${userName} has ended`,
    data: {
      duration,
      roomId,
      appointmentId: session.appointmentId,
    },
  });

  // ✅ Redis cleanup after 5 minutes
  setTimeout(() => this.deleteSession(roomId), 5 * 60 * 1000);

  console.log(`✅ Call ended → Room: ${roomId} | Duration: ${duration}s`);
  return true;
}

  // Public API — all Redis-backed
  async getActiveSession(roomId: string): Promise<VideoCallSession | null> {
    return this.getSession(roomId);
  }

  async getSessionByAppointment(appointmentId: string): Promise<VideoCallSession | null> {
    const sessions = await this.getAllActiveSessions();
    return sessions.find(s => s.appointmentId === appointmentId && s.status !== "ended") || null;
  }

  async isUserInCall(userId: string): Promise<boolean> {
    const sessions = await this.getAllActiveSessions();
    return sessions.some(s =>
      (s.doctorId === userId || s.patientId === userId) && s.status === "active"
    );
  }

  async getSessionByUser(userId: string): Promise<VideoCallSession[]> {
    const sessions = await this.getAllActiveSessions();
    return sessions.filter(s => s.doctorId === userId || s.patientId === userId);
  }
}