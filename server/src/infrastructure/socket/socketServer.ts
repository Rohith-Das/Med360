// server/src/infrastructure/socket/SocketServer.ts

import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { container } from "tsyringe";
import { AuthService } from "../../application/service/AuthService";
import { TokenPayload } from "../../shared/AuthType";
import { createAdapter } from "@socket.io/redis-adapter";
import { redis } from "../config/redis";
import { RedisService } from "../services/RedisService"; // Assuming you have injected RedisService
import { NotificationService } from "../../application/notification/NotificationService"; // Included for completeness

// Define the augmented socket type for authenticated users
interface AuthenticatedSocket extends Socket {
    userId?: string;
    userRole?: 'doctor' | 'patient' | 'admin';
    userName?: string;
}

export class SocketServer {
    private io: Server;
    private redisService: RedisService; // Dependency Injection

    // REDUNDANT LOCAL MAPS ARE REMOVED FOR SCALABILITY:
    // connectedUsers, doctorSockets, patientSockets, activeVideoRooms, etc., are now handled by Redis or the adapter.

    constructor(httpServer: HttpServer) {
        // Resolve RedisService (Assuming tsyringe is used)
        this.redisService = container.resolve(RedisService);

        this.io = new Server(httpServer, {
            cors: {
                origin: process.env.CLIENT_URL || 'http://localhost:5173',
                methods: ['GET', 'POST'],
                credentials: true
            },
            // Configure heartbeat for faster disconnection detection
            pingInterval: 10000, 
            pingTimeout: 5000 
        });

        // ------------------------------------------------
        // CORE SCALABILITY: Setup Redis Adapter
        // All server instances will connect to the same Redis instance
        // for inter-server communication and room/socket state sharing.
        // ------------------------------------------------
        const pubClient = redis.duplicate();
        const subClient = redis.duplicate();
        this.io.adapter(createAdapter(pubClient, subClient));
        console.log('Socket.IO adapter is now Redis-backed for horizontal scaling.');

        this.setupMiddleware();
        this.setupEventHandlers();
    }

    private setupMiddleware() {
        // Authentication Middleware remains the same, as it runs on connection establishment
        this.io.use(async (socket: any, next) => {
            try {
                const token = socket.handshake.auth.token;
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
        this.io.on('connection', async (socket: AuthenticatedSocket) => {
            console.log(`User connected: ${socket.userName} (${socket.userRole}) - Socket: ${socket.id}`);

            if (socket.userId) {
                // 1. SCALABLE STATE MANAGEMENT: Store userId -> socketId mapping in Redis
                await this.redisService.setSocketIdForUser(socket.userId, socket.id);

                // 2. Join dedicated rooms (Role and User ID for targeted messaging)
                socket.join(`user_${socket.userId}`); // For sendToUser
                socket.join(socket.userRole || 'unknown'); // For broadcastToRole
            }

            // Handle disconnection
            socket.on('disconnect', async () => {
                console.log(`User disconnected: ${socket.userName}`);

                if (socket.userId) {
                    // 1. SCALABLE STATE MANAGEMENT: Remove mapping from Redis
                    await this.redisService.deleteUserSocketId(socket.userId);

                    // 2. Room Cleanup: Notify active video room peers about disconnection
                    // Use socket.rooms to get all rooms the user was in
                    for (const roomId of socket.rooms) {
                        // Assuming all video room IDs start with 'video-room-' for filtering
                        if (roomId.startsWith('video-room-')) { 
                            socket.to(roomId).emit('video:participant-left', {
                                userId: socket.userId,
                                userName: socket.userName,
                                socketId: socket.id,
                            });
                            // The Redis Adapter handles the automatic removal of the socket from the room
                        }
                    }
                }
            });

            // Video call event handlers
            this.setupVideoCallEvents(socket);

            // Notification events
            this.setupNotificationEvents(socket);
        });
    }

    private setupVideoCallEvents(socket: AuthenticatedSocket) {
        // --- video:join-room ---
        socket.on('video:join-room', async (data: { roomId: string; appointmentId?: string }) => {
            const { roomId } = data;
            
            // Core Action: Join the Room (Redis Adapter handles this scalably)
            await socket.join(roomId);
            console.log(`${socket.userName} joined video room ${roomId}`);

            try {
                // Get all sockets currently in the room using the scalable fetchSockets method
                const socketsInRoom = await this.io.in(roomId).fetchSockets();

                // Map to your desired participant data structure, excluding self
                const allParticipants = socketsInRoom
                    .filter(s => s.id !== socket.id)
                    .map((s: any) => ({
                        userId: s.userId,
                        userName: s.userName,
                        socketId: s.id,
                        userRole: s.userRole,
                    }));

                const participantsCount = allParticipants.length;

                // Notify EXISTING participants about the new joiner
                socket.to(roomId).emit('video:participant-joined', {
                    userId: socket.userId,
                    userName: socket.userName,
                    userRole: socket.userRole,
                    socketId: socket.id,
                    participantsCount: participantsCount + 1 
                });

                // Send the new joiner the list of ALL current participants (excluding themselves)
                socket.emit('video:room-participants', {
                    roomId,
                    participants: allParticipants,
                    participantsCount: participantsCount
                });

                console.log(`✅ Room ${roomId} has ${participantsCount + 1} participants (Redis-backed check)`);
            } catch (error) {
                console.error(`Error fetching sockets in room ${roomId}:`, error);
            }
        });

        // WebRTC signaling - offer, answer, ice-candidate
        // These handlers remain largely the same, relying on io.to() which is now scalable
        
        socket.on('video:offer', (data: { roomId: string; offer: any; targetSocketId?: string }) => {
            const { offer, targetSocketId, roomId } = data;
            
            if (targetSocketId) {
                this.io.to(targetSocketId).emit('video:offer', {
                    offer,
                    fromSocketId: socket.id,
                    fromUserId: socket.userId,
                    fromUserName: socket.userName,
                    fromUserRole: socket.userRole
                });
            } else {
                // Broadcast to all in room except sender (socket.to is scalable)
                socket.to(roomId).emit('video:offer', {
                    offer,
                    fromSocketId: socket.id,
                    fromUserId: socket.userId,
                    fromUserName: socket.userName,
                    fromUserRole: socket.userRole
                });
            }
        });

        socket.on('video:answer', (data: { roomId: string; answer: any; targetSocketId: string }) => {
            const { answer, targetSocketId } = data;
            
            this.io.to(targetSocketId).emit('video:answer', {
                answer,
                fromSocketId: socket.id,
                fromUserId: socket.userId,
                fromUserName: socket.userName,
                fromUserRole: socket.userRole
            });
        });

        socket.on('video:ice-candidate', (data: { roomId: string; candidate: any; targetSocketId?: string }) => {
            const { candidate, targetSocketId, roomId } = data;
            
            if (targetSocketId) {
                this.io.to(targetSocketId).emit('video:ice-candidate', {
                    candidate,
                    fromSocketId: socket.id,
                    fromUserId: socket.userId
                });
            } else {
                // Broadcast to all in room except sender (socket.to is scalable)
                socket.to(roomId).emit('video:ice-candidate', {
                    candidate,
                    fromSocketId: socket.id,
                    fromUserId: socket.userId
                });
            }
        });

        // --- video:leave-room ---
        socket.on('video:leave-room', async (data: { roomId: string }) => {
            const { roomId } = data;
            
            await socket.leave(roomId);
            console.log(`${socket.userName} left video room ${roomId}`);

            // Notify remaining participants (scalable)
            socket.to(roomId).emit('video:participant-left', {
                userId: socket.userId,
                userName: socket.userName,
                socketId: socket.id,
            });
            
            // You can optionally check if the room is empty using fetchSockets, but 
            // the core cleanup of the room reference is handled by the adapter.
        });
        
        // Audio/Video/Screen toggle events remain the same (rely on socket.to(roomId).emit)
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

        
        // ... (Screen sharing and quality monitoring events follow the same scalable pattern)
    }

    private setupNotificationEvents(socket: AuthenticatedSocket) {
        // Notification events remain the same
        socket.on('mark_notification_read', (data: { notificationId: string }) => {
            console.log(`Notification ${data.notificationId} marked as read by ${socket.userId}`);
            socket.emit('notification_read_confirmed', data);
        });

        socket.on('mark_all_notifications_read', (data: { userId: string }) => {
            console.log(`All notifications marked as read for user ${data.userId}`);
            socket.emit('all_notifications_read_confirmed', data);
        });
      
    }

    // ------------------------------------------------
    // PUBLIC METHODS (Updated to be scalable)
    // ------------------------------------------------

    public async sendToUser(userId: string, event: string, data: any): Promise<boolean> {
        // Use the Redis-backed mapping to get the target socket ID
        const socketId = await this.redisService.getSocketIdForUser(userId);
        
        if (socketId) {
            // io.to() works across all server instances due to the Redis Adapter
            this.io.to(socketId).emit(event, data);
            console.log(`Event ${event} sent to user ${userId} (via Redis)`);
            return true;
        }
        console.log(`User ${userId} not connected - event ${event} not sent`);
        return false;
    }

    public sendToRoom(roomId: string, event: string, data: any): void {
        // io.to(room) is inherently scalable with the Redis Adapter
        this.io.to(roomId).emit(event, data);
        console.log(`Event ${event} sent to room ${roomId}`);
    }

    public async getSocketId(userId: string): Promise<string | null> {
        return this.redisService.getSocketIdForUser(userId);
    }
    
    // sendToDoctor/sendToPatient methods should be deprecated in favor of sendToUser
    // OR they can be implemented using the role-based rooms (if the data is generic)
    public sendToDoctor(doctorId: string, event: string, data: any): Promise<boolean> {
        return this.sendToUser(doctorId, event, data);
    }
    
    public sendToPatient(patientId: string, event: string, data: any): Promise<boolean> {
        return this.sendToUser(patientId, event, data);
    }

    // broadcastToRole is safe because roles are joined as rooms
    public broadcastToRole(role: 'doctor' | 'patient' | 'admin', event: string, data: any): void {
        this.io.to(role).emit(event, data);
        console.log(`Event ${event} broadcasted to all ${role}s`);
    }
    
    // ... (Other specific public methods like sendIncomingCallNotification need to be refactored 
    // to use Redis or your main database for temporary state instead of local Maps)
    
    // Placeholder for scalable status checks
    public async isUserOnline(userId: string): Promise<boolean> {
        const socketId = await this.redisService.getSocketIdForUser(userId);
        return !!socketId;
    }

    public getIO(): Server {
        return this.io;
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