import { injectable, inject } from "tsyringe";
import { IAppointmentRepository } from "../../domain/repositories/AppointmentRepository";
import { getSocketServer } from "../../infrastructure/socket/socketServer";
import { NotificationService } from "../notification/NotificationService";
import { IDoctorRepository } from "../../domain/repositories/DoctorRepository-method";
import { IPatientRepository } from "../../domain/repositories/patientRepository_method";
import { VideoCallSessionModel } from "../../infrastructure/database/models/VideoCallSessionModel";

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
  ) {
    // Load active sessions from DB on initialization
    this.loadActiveSessions();
  }

  /**
   * Load active sessions from MongoDB into memory on server start
   */
  private async loadActiveSessions(): Promise<void> {
    try {
      const activeSessions = await VideoCallSessionModel.find({
        status: { $in: ["waiting", "active"] }
      }).lean();

      activeSessions.forEach(session => {
        this.activeSession.set(session.roomId, {
          roomId: session.roomId,
          appointmentId: session.appointmentId,
          doctorId: session.doctorId,
          patientId: session.patientId,
          status: session.status,
          startedAt: session.startedAt,
          endedAt: session.endedAt,
          initiatedBy: session.initiatedBy,
          doctorName: session.doctorName,
          patientName: session.patientName
        });
      });

      console.log(`✅ Loaded ${activeSessions.length} active sessions from database`);
    } catch (error) {
      console.error('❌ Failed to load active sessions:', error);
    }
  }

  /**
   * Get session from memory or database
   */
  private async getSessionFromMemoryOrDB(roomId: string): Promise<VideoCallSession | null> {
    // First check in-memory cache
    let session = this.activeSession.get(roomId);
    
    if (session) {
      console.log(`✅ Session found in memory for room: ${roomId}`);
      return session;
    }

    // If not in memory, check database
    console.log(`🔍 Session not in memory, checking database for room: ${roomId}`);
    const dbSession = await VideoCallSessionModel.findOne({
      roomId,
      status: { $in: ["waiting", "active"] }
    }).lean();

    if (dbSession) {
      console.log(`✅ Session found in database for room: ${roomId}`);
      
      // Convert MongoDB document to VideoCallSession and cache it
      session = {
        roomId: dbSession.roomId,
        appointmentId: dbSession.appointmentId,
        doctorId: dbSession.doctorId,
        patientId: dbSession.patientId,
        status: dbSession.status,
        startedAt: dbSession.startedAt,
        endedAt: dbSession.endedAt,
        initiatedBy: dbSession.initiatedBy,
        doctorName: dbSession.doctorName,
        patientName: dbSession.patientName
      };
      
      // Cache in memory for future requests
      this.activeSession.set(roomId, session);
      return session;
    }

    console.error(`❌ Session not found in memory or database for room: ${roomId}`);
    return null;
  }

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

    // Check for existing active session
    const existingSession = await VideoCallSessionModel.findOne({
      appointmentId,
      status: { $in: ["waiting", "active"] }
    }).lean();

    if (existingSession) {
      console.log(`✅ Found existing session for appointment: ${appointmentId}`);
      const session: VideoCallSession = {
        roomId: existingSession.roomId,
        appointmentId: existingSession.appointmentId,
        doctorId: existingSession.doctorId,
        patientId: existingSession.patientId,
        status: existingSession.status,
        startedAt: existingSession.startedAt,
        endedAt: existingSession.endedAt,
        initiatedBy: existingSession.initiatedBy,
        doctorName: existingSession.doctorName,
        patientName: existingSession.patientName
      };
      
      // Cache in memory
      this.activeSession.set(existingSession.roomId, session);
      return session;
    }
   
    const roomId = `room_${appointmentId}_${Date.now()}`;
    
    // Fetch names for both doctor and patient
    const doctor = await this.doctorRepo.findById(appointment.doctorId.toString());
    const patient = await this.patientRepo.findById(appointment.patientId.toString());
    
    if (!doctor || !patient) {
      throw new Error("Doctor or patient information not found");
    }
    
    const initiatorName = initiatorRole === "doctor" ? doctor?.name : patient?.name;
    const recipientId = initiatorRole === "doctor"
      ? appointment.patientId.toString()
      : appointment.doctorId.toString();
    const recipientRole = initiatorRole === "doctor" ? "patient" : "doctor";

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

    // Save to both database and memory
    await VideoCallSessionModel.create(session);
    this.activeSession.set(roomId, session);
    console.log(`✅ Video call session created and cached: ${roomId}`);

    // Enhanced socket notification
    const completeCallData = {
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
      patientId: patient.id || appointment.patientId.toString(),
      doctorId: doctor.id || appointment.doctorId.toString(),
      status: "waiting",
      timestamp: new Date().toISOString()
    };

    console.log(`📞 Sending incoming call to ${recipientRole}: ${recipientId}`);
    
    const socketServer = getSocketServer();
    let socketSent = false;
    
    if (initiatorRole === 'doctor') {
      socketSent = socketServer.sendToPatient(recipientId, 'incoming_video_call', completeCallData);
    } else {
      socketSent = socketServer.sendToDoctor(recipientId, 'incoming_video_call', completeCallData);
    }

    if (!socketSent) {
      console.warn(`⚠️ Socket notification failed - user ${recipientId} may be offline`);
    }
    
    // Create persistent notification
    try {
      await this.notificationService.createVideoCallNotification({
        appointmentId,
        recipientId,
        initiatorId,
        initiatorRole,
        initiatorName,
        roomId, 
        type: "video_call_initiated",
        title: `Incoming Video Call from ${initiatorRole === "doctor" ? "Dr. " : ""}${initiatorName}`,
        message: `Join the video call for your appointment on ${appointment.date.toISOString().split("T")[0]}`,
        data: completeCallData,
      });
      console.log(`✅ Persistent notification created with roomId: ${roomId}`);
    } catch (error) {
      console.error(`❌ Failed to create notification:`, error);
    }
    
    return session;
  }

  async joinCall(roomId: string, userId: string): Promise<VideoCallSession | null> {
    console.log(`🔵 Join call attempt - Room: ${roomId}, User: ${userId}`);
    
    // Get session from memory or database
    const session = await this.getSessionFromMemoryOrDB(roomId);
    
    if (!session) {
      console.error(`❌ Video call session not found for room: ${roomId}`);
      console.log(`📋 Active in-memory sessions:`, Array.from(this.activeSession.keys()));
      throw new Error("Video call session not found or expired");
    }
    
    const isDoctor = session.doctorId === userId;
    const isPatient = session.patientId === userId;

    if (!isDoctor && !isPatient) {
      console.error(`❌ Unauthorized join attempt by ${userId} for room ${roomId}`);
      throw new Error("Unauthorized to join this video call");
    }
    
    const userRole: 'doctor' | 'patient' = isDoctor ? 'doctor' : 'patient';
    const userData = isDoctor 
      ? await this.doctorRepo.findById(userId) 
      : await this.patientRepo.findById(userId);
    const userName = userData?.name || (isDoctor ? 'Doctor' : 'Patient');
    
    console.log(`✅ User ${userName} (${userRole}) authorized to join room ${roomId}`);

    if (session.status === "waiting") {
      session.status = "active";
      this.activeSession.set(roomId, session);
      console.log(`🟢 Call status updated to ACTIVE for room ${roomId}`);

      await VideoCallSessionModel.updateOne(
        { roomId },
        { $set: { status: 'active' } }
      );
      console.log(`✅ Session status persisted to MongoDB for room: ${roomId}`);
    }

    // Notify via socket
    const socketServer = getSocketServer();
    const otherUserId = isDoctor ? session.patientId : session.doctorId;

    socketServer.sendToUser(otherUserId, 'call_participant_joined', {
      roomId,
      userId,
      userName,
      userRole,
      socketId: socketServer.getSocketId(userId),
      status: session.status,
    });

    const participants = [
      {
        userId: session.doctorId,
        userName: session.doctorName || 'Doctor',
        socketId: socketServer.getSocketId(session.doctorId),
        userRole: 'doctor' as const
      },
      {
        userId: session.patientId,
        userName: session.patientName || 'Patient',
        socketId: socketServer.getSocketId(session.patientId),
        userRole: 'patient' as const
      }
    ].filter(p => p.socketId);

    socketServer.sendToRoom(roomId, 'video:room-participants', {
      roomId,
      participants,
      participantsCount: participants.length
    });

    console.log(`✅ User ${userName} (${userRole}) successfully joined video call ${roomId}`);
    return session;
  }

  async endCall(roomId: string, userId: string): Promise<boolean> {
    const session = await this.getSessionFromMemoryOrDB(roomId);
    
    if (!session) {
      console.warn(`Call end requested for non-existent room: ${roomId}`);
      return false;
    }
    
    // Authorization check
    if (session.doctorId !== userId && session.patientId !== userId) {
      throw new Error("Unauthorized to end this video call");
    }

    // Update session
    session.status = "ended";
    session.endedAt = new Date();
    
    await VideoCallSessionModel.updateOne(
      { roomId },
      { $set: { status: "ended", endedAt: session.endedAt } }
    );
    console.log(`✅ Session ended and persisted to MongoDB for room: ${roomId}`);

    const socketServer = getSocketServer();
    const otherUserId = session.doctorId === userId ? session.patientId : session.doctorId;

    const isDoctor = session.doctorId === userId;
    const userData = isDoctor 
      ? await this.doctorRepo.findById(userId)
      : await this.patientRepo.findById(userId);
    const initiatorName = userData?.name || (isDoctor ? 'Doctor' : 'Patient');
    const initiatorRole: 'doctor' | 'patient' = isDoctor ? 'doctor' : 'patient';
    
    // Notify about call end
    socketServer.sendCallEndNotification(otherUserId, {
      roomId,
      endedBy: userId,
      endedByName: initiatorName,
      reason: "ended_by_user",
    });

    socketServer.sendToRoom(roomId, 'video:call-ended', {
      roomId,
      endedBy: userId,
      endedByName: initiatorName,
      endedAt: session.endedAt
    });

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
      console.log(`🧹 Cleaned up in-memory session for room: ${roomId}`);
    }, 5 * 60 * 1000);

    console.log(`❌ Video call ended by ${initiatorName} in room: ${roomId} (Duration: ${duration}s)`);
    return true;
  }

  async getActiveSession(roomId: string): Promise<VideoCallSession | null> {
    return await this.getSessionFromMemoryOrDB(roomId);
  }

  getSessionByUser(userId: string): VideoCallSession[] {
    return Array.from(this.activeSession.values()).filter(
      (session) => session.doctorId === userId || session.patientId === userId
    );
  }

  getAllActiveSessions(): VideoCallSession[] {
    return Array.from(this.activeSession.values());
  }

  isUserInCall(userId: string): boolean {
    return Array.from(this.activeSession.values()).some(
      session => (session.doctorId === userId || session.patientId === userId) && 
                 session.status === 'active'
    );
  }

  async getSessionByAppointment(appointmentId: string): Promise<VideoCallSession | null> {
    // Check memory first
    const memorySession = Array.from(this.activeSession.values()).find(
      session => session.appointmentId === appointmentId && session.status !== 'ended'
    );
    
    if (memorySession) {
      return memorySession;
    }
    
    // Check database
    const dbSession = await VideoCallSessionModel.findOne({
      appointmentId,
      status: { $in: ["waiting", "active"] }
    }).lean();
    
    if (dbSession) {
      const session: VideoCallSession = {
        roomId: dbSession.roomId,
        appointmentId: dbSession.appointmentId,
        doctorId: dbSession.doctorId,
        patientId: dbSession.patientId,
        status: dbSession.status,
        startedAt: dbSession.startedAt,
        endedAt: dbSession.endedAt,
        initiatedBy: dbSession.initiatedBy,
        doctorName: dbSession.doctorName,
        patientName: dbSession.patientName
      };
      
      // Cache it
      this.activeSession.set(dbSession.roomId, session);
      return session;
    }
    
    return null;
  }
}