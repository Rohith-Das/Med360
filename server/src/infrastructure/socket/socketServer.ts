// server/src/infrastructure/socket/socketServer.ts
import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { container } from "tsyringe";
import { AuthService } from "../../application/service/AuthService";
import { TokenPayload } from "../../shared/AuthType";
import { NotificationService } from "../../application/notification/NotificationService";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: 'doctor' | 'patient' | 'admin';
  userName?: string;
}

export class SocketServer {
  private io: Server;
  private connectedUsers = new Map<string, string>(); // userId -> socketId
  private socketToUser = new Map<string, string>(); // socketId -> userId
  private doctorSockets = new Map<string, string>(); // doctorId -> socketId
  private patientSockets = new Map<string, string>(); // patientId -> socketId
  private activeVideoRooms = new Map<string, Set<string>>(); // roomId -> Set<socketId>
  private roomParticipants = new Map<string, Map<string, any>>(); // roomId -> Map<socketId, participantData>
  private userRoomMapping = new Map<string, string>(); // socketId -> roomId
  private incomingCalls = new Map<string, any>(); // userId -> callData

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use(async (socket: any, next) => {
      try {
        const token = socket.handshake.auth.token;
        console.log('Socket auth token received');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const authService = container.resolve<AuthService>('AuthService');
        let payload: TokenPayload;

        try {
          payload = authService.verifyAccessToken(token);
        } catch {
          try {
            payload = authService.verifyDoctorAccessToken(token);
          } catch {
            payload = authService.verifyAdminAccessToken(token);
          }
        }

        socket.userId = payload.userId;
        socket.userRole = payload.role;
        socket.userName = payload.name;
        
        console.log(`Socket authenticated: ${socket.userName} (${socket.userRole})`);
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User connected: ${socket.userName} (${socket.userRole}) - Socket: ${socket.id}`);

      if (socket.userId) {
        this.connectedUsers.set(socket.userId, socket.id);
        this.socketToUser.set(socket.id, socket.userId);
        
        if (socket.userRole === 'doctor') {
          this.doctorSockets.set(socket.userId, socket.id);
        } else if (socket.userRole === 'patient') {
          this.patientSockets.set(socket.userId, socket.id);
        }

        // Join user-specific room
        socket.join(`user_${socket.userId}`);
        socket.join(socket.userRole || 'unknown');
      }

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.userName}`);
        
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
          this.socketToUser.delete(socket.id);
          this.doctorSockets.delete(socket.userId);
          this.patientSockets.delete(socket.userId);
          this.incomingCalls.delete(socket.userId);

          // Clean up video room if user was in one
          const roomId = this.userRoomMapping.get(socket.id);
          if (roomId && this.activeVideoRooms.has(roomId)) {
            const participants = this.activeVideoRooms.get(roomId)!;
            participants.delete(socket.id);
            
            // Notify other participants about disconnection
            socket.to(roomId).emit('video:participant-left', {
              userId: socket.userId,
              userName: socket.userName,
              socketId: socket.id,
            });

            // Clean up room participants map
            const roomParticipantsMap = this.roomParticipants.get(roomId);
            if (roomParticipantsMap) {
              roomParticipantsMap.delete(socket.id);
            }

            // Clean up empty room
            if (participants.size === 0) {
              this.activeVideoRooms.delete(roomId);
              this.roomParticipants.delete(roomId);
            }
          }
          
          this.userRoomMapping.delete(socket.id);
        }
      });

      // Video call event handlers
      this.setupVideoCallEvents(socket);
      
      // Notification events
      this.setupNotificationEvents(socket);
    });
  }

  private setupVideoCallEvents(socket: AuthenticatedSocket) {
    // Join video room
    socket.on('video:join-room', (data: { roomId: string; appointmentId?: string; userId?: string; userName?: string; userRole?: string }) => {
      const { roomId, appointmentId } = data;
      
      socket.join(roomId);
      console.log(`${socket.userName} joined video room ${roomId}`);
      
      if (!this.activeVideoRooms.has(roomId)) {
        this.activeVideoRooms.set(roomId, new Set());
        this.roomParticipants.set(roomId, new Map());
      }
      
      this.activeVideoRooms.get(roomId)!.add(socket.id);
      this.userRoomMapping.set(socket.id, roomId);

      // Store participant data
      const participantData = {
        userId: socket.userId,
        userName: socket.userName,
        socketId: socket.id,
        userRole: socket.userRole,
        joinedAt: new Date()
      };
      this.roomParticipants.get(roomId)!.set(socket.id, participantData);

      const participantsCount = this.activeVideoRooms.get(roomId)!.size;

      // Get all current room participants BEFORE notifying
      const allParticipants = Array.from(this.roomParticipants.get(roomId)!.values());

      console.log(`Room ${roomId} now has ${participantsCount} participants`);
      console.log(`All participants:`, allParticipants);

      // CRITICAL: Notify EXISTING participants about the new joiner
      socket.to(roomId).emit('video:participant-joined', {
        userId: socket.userId,
        userName: socket.userName,
        userRole: socket.userRole,
        socketId: socket.id,
        participantsCount
      });

      // CRITICAL: Send the new joiner the list of ALL current participants (excluding themselves)
      const otherParticipants = allParticipants.filter(p => p.socketId !== socket.id);
      socket.emit('video:room-participants', {
        roomId,
        participants: otherParticipants,
        participantsCount: allParticipants.length
      });

      console.log(`✅ Sent room-participants to new joiner ${socket.id}: ${otherParticipants.length} other participants`);
    });

    // WebRTC signaling - offer
    socket.on('video:offer', (data: { roomId: string; offer: any; targetSocketId?: string }) => {
      const { roomId, offer, targetSocketId } = data;
      console.log(`Offer from ${socket.userName} in room ${roomId} to ${targetSocketId}`);
      
      if (targetSocketId) {
        // Send to specific target
        this.io.to(targetSocketId).emit('video:offer', {
          offer,
          fromSocketId: socket.id,
          fromUserId: socket.userId,
          fromUserName: socket.userName,
          fromUserRole: socket.userRole
        });
        console.log(`✅ Offer delivered to ${targetSocketId}`);
      } else {
        // Broadcast to all in room except sender
        socket.to(roomId).emit('video:offer', {
          offer,
          fromSocketId: socket.id,
          fromUserId: socket.userId,
          fromUserName: socket.userName,
          fromUserRole: socket.userRole
        });
        console.log(`✅ Offer broadcasted in room ${roomId}`);
      }
    });

    // WebRTC signaling - answer
    socket.on('video:answer', (data: { roomId: string; answer: any; targetSocketId: string }) => {
      const { roomId, answer, targetSocketId } = data;
      console.log(`Answer from ${socket.userName} in room ${roomId} to ${targetSocketId}`);
      
      this.io.to(targetSocketId).emit('video:answer', {
        answer,
        fromSocketId: socket.id,
        fromUserId: socket.userId,
        fromUserName: socket.userName,
        fromUserRole: socket.userRole
      });
      console.log(`✅ Answer delivered to ${targetSocketId}`);
    });

    // WebRTC signaling - ICE candidate
    socket.on('video:ice-candidate', (data: { roomId: string; candidate: any; targetSocketId?: string }) => {
      const { roomId, candidate, targetSocketId } = data;
      
      if (targetSocketId) {
        this.io.to(targetSocketId).emit('video:ice-candidate', {
          candidate,
          fromSocketId: socket.id,
          fromUserId: socket.userId
        });
      } else {
        socket.to(roomId).emit('video:ice-candidate', {
          candidate,
          fromSocketId: socket.id,
          fromUserId: socket.userId
        });
      }
    });

    // Leave video room
    socket.on('video:leave-room', (data: { roomId: string }) => {
      const { roomId } = data;
      
      socket.leave(roomId);
      console.log(`${socket.userName} left video room ${roomId}`);
      
      if (this.activeVideoRooms.has(roomId)) {
        this.activeVideoRooms.get(roomId)!.delete(socket.id);
        
        const roomParticipantsMap = this.roomParticipants.get(roomId);
        if (roomParticipantsMap) {
          roomParticipantsMap.delete(socket.id);
        }

        if (this.activeVideoRooms.get(roomId)!.size === 0) {
          this.activeVideoRooms.delete(roomId);
          this.roomParticipants.delete(roomId);
          console.log(`Room ${roomId} is now empty, cleaning up`);
        }
      }
      
      this.userRoomMapping.delete(socket.id);
      
      socket.to(roomId).emit('video:participant-left', {
        userId: socket.userId,
        userName: socket.userName,
        socketId: socket.id,
        participantsCount: this.activeVideoRooms.get(roomId)?.size || 0
      });
    });

    // Audio/Video toggle events
    socket.on('video:toggle-audio', (data: { roomId: string; isMuted: boolean }) => {
      const { roomId, isMuted } = data;
      socket.to(roomId).emit('video:participant-audio-toggle', {
        userId: socket.userId,
        userName: socket.userName,
        isMuted
      });
    });

    socket.on('video:toggle-video', (data: { roomId: string; isVideoOff: boolean }) => {
      const { roomId, isVideoOff } = data;
      socket.to(roomId).emit('video:participant-video-toggle', {
        userId: socket.userId,
        userName: socket.userName,
        isVideoOff
      });
    });

    // Screen sharing events
    socket.on('video:start-screen-share', (data: { roomId: string }) => {
      const { roomId } = data;
      socket.to(roomId).emit('video:participant-screen-share-started', {
        userId: socket.userId,
        userName: socket.userName,
        socketId: socket.id
      });
    });

    socket.on('video:stop-screen-share', (data: { roomId: string }) => {
      const { roomId } = data;
      socket.to(roomId).emit('video:participant-screen-share-stopped', {
        userId: socket.userId,
        userName: socket.userName,
        socketId: socket.id
      });
    });

    // Connection quality monitoring
    socket.on('video:connection-quality', (data: { roomId: string; quality: 'poor' | 'fair' | 'good' | 'excellent' }) => {
      const { roomId, quality } = data;
      console.log(`Connection quality for ${socket.userName} in ${roomId}: ${quality}`);
    });
  }

  private setupNotificationEvents(socket: AuthenticatedSocket) {
    socket.on('mark_notification_read', (data: { notificationId: string }) => {
      console.log(`Notification ${data.notificationId} marked as read by ${socket.userId}`);
      socket.emit('notification_read_confirmed', data);
    });

    socket.on('mark_all_notifications_read', (data: { userId: string }) => {
      console.log(`All notifications marked as read for user ${data.userId}`);
      socket.emit('all_notifications_read_confirmed', data);
    });

    socket.on('request_notification_count', () => {
      console.log(`Notification count requested by ${socket.userId}`);
    });
  }

  // Public methods for sending messages

  public sendToUser(userId: string, event: string, data: any): boolean {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      console.log(`Event ${event} sent to user ${userId}`);
      return true;
    }
    console.log(`User ${userId} not connected - event ${event} not sent`);
    return false;
  }

  public sendToRoom(roomId: string, event: string, data: any): void {
    this.io.to(roomId).emit(event, data);
    console.log(`Event ${event} sent to room ${roomId}`);
  }

  public getSocketId(userId: string): string | undefined {
    return this.connectedUsers.get(userId);
  }

  public sendToDoctor(doctorId: string, event: string, data: any): boolean {
    const socketId = this.doctorSockets.get(doctorId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      console.log(`Event ${event} sent to doctor ${doctorId}`);
      return true;
    }
    return false;
  }

  public sendToPatient(patientId: string, event: string, data: any): boolean {
    const socketId = this.patientSockets.get(patientId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      console.log(`Event ${event} sent to patient ${patientId} (socket ${socketId})`);
      return true;
    }
    console.log(`Patient ${patientId} not connected - event ${event} not sent`);
    return false;
  }

  public broadcastToRole(role: 'doctor' | 'patient' | 'admin', event: string, data: any): void {
    this.io.to(role).emit(event, data);
    console.log(`Event ${event} broadcasted to all ${role}s`);
  }

  // Video call specific methods
  
  public sendIncomingCallNotification(targetUserId: string, callData: any): boolean {
    this.incomingCalls.set(targetUserId, callData);
    if (callData.initiatorRole === 'doctor') {
      return this.sendToPatient(targetUserId, 'incoming_video_call', callData);
    } else {
      return this.sendToDoctor(targetUserId, 'incoming_video_call', callData);
    }
  }

  public sendCallEndNotification(targetUserId: string, callData: any): boolean {
    this.incomingCalls.delete(targetUserId);
    if (callData.initiatorRole === 'doctor') {
      return this.sendToPatient(targetUserId, 'video_call_ended', callData);
    } else {
      return this.sendToDoctor(targetUserId, 'video_call_ended', callData);
    }
  }

  public sendAppointmentReminder(userId: string, reminderData: any): boolean {
    return this.sendToUser(userId, 'appointment_reminder', reminderData);
  }

  // Notification specific methods

  public sendAppointmentNotificationToDoctor(doctorId: string, notification: any): boolean {
    return this.sendToDoctor(doctorId, 'new_notification', notification);
  }

  public sendAppointmentUpdateToPatient(patientId: string, notification: any): boolean {
    return this.sendToPatient(patientId, 'appointment_update', notification);
  }

  // Utility methods

  public getConnectedUserCount(): number {
    return this.connectedUsers.size;
  }

  public getConnectedDoctorCount(): number {
    return this.doctorSockets.size;
  }

  public getConnectedPatientCount(): number {
    return this.patientSockets.size;
  }

  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  public isDoctorOnline(doctorId: string): boolean {
    return this.doctorSockets.has(doctorId);
  }

  public isPatientOnline(patientId: string): boolean {
    return this.patientSockets.has(patientId);
  }

  public getActiveVideoRooms(): Map<string, Set<string>> {
    return this.activeVideoRooms;
  }

  public getRoomParticipantsCount(roomId: string): number {
    return this.activeVideoRooms.get(roomId)?.size || 0;
  }

  public isRoomActive(roomId: string): boolean {
    return this.activeVideoRooms.has(roomId) && this.activeVideoRooms.get(roomId)!.size > 0;
  }

  public getRoomParticipantsData(roomId: string): any[] {
    const participantsMap = this.roomParticipants.get(roomId);
    return participantsMap ? Array.from(participantsMap.values()) : [];
  }

  public getIO(): Server {
    return this.io;
  }

  public getSocketStats() {
    return {
      totalConnected: this.connectedUsers.size,
      doctors: this.doctorSockets.size,
      patients: this.patientSockets.size,
      activeVideoRooms: this.activeVideoRooms.size,
      pendingCalls: this.incomingCalls.size
    };
  }
}

// Singleton pattern for socket server
let socketServer: SocketServer;

export const initializeSocketServer = (httpServer: HttpServer): SocketServer => {
  socketServer = new SocketServer(httpServer);
  console.log('Socket server initialized');
  return socketServer;
};

export const getSocketServer = (): SocketServer => {
  if (!socketServer) {
    throw new Error('Socket server not initialized. Call initializeSocketServer first.');
  }
  return socketServer;
};