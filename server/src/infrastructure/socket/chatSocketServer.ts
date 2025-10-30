// server/src/infrastructure/socket/chatSocketServer.ts
import { Server as SocketIOServer, Socket } from 'socket.io';
import { container } from 'tsyringe';
import { AuthService } from '../../application/service/AuthService';
import { TokenPayload } from '../../shared/AuthType';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: 'doctor' | 'patient';
  userName?: string;
}

interface TypingData {
  roomId: string;
  userName: string;
  userRole: 'doctor' | 'patient';
}

interface OnlineStatus {
  userId: string;
  isOnline: boolean;
  lastSeen: Date;
}

export class ChatSocketServer {
  private io: SocketIOServer;
  private userSockets = new Map<string, string>(); // userId -> socketId
  private socketToUser = new Map<string, string>(); // socketId -> userId
  private roomUsers = new Map<string, Set<string>>(); // roomId -> Set<userId>
  private onlineUsers = new Map<string, OnlineStatus>(); // userId -> status
  private typingUsers = new Map<string, Set<string>>(); // roomId -> Set<userId>

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupNamespace();
  }

  private setupNamespace() {
    const chatNamespace = this.io.of('/chat');

    // Authentication middleware
    chatNamespace.use(async (socket: any, next) => {
      try {
        const token = socket.handshake.auth.token;
        console.log('🔐 Chat socket auth attempt');

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const authService = container.resolve<AuthService>('AuthService');
        let payload: TokenPayload |null=null;

        try {
          payload = authService.verifyAccessToken(token);
          console.log('this is payload from chatsocketservice for patient',payload);
          
        } catch {
          try {
            payload = authService.verifyDoctorAccessToken(token);
          } catch {
            return next(new Error('Invalid token'));
          }
        }

        socket.userId = payload.userId;
        socket.userRole = payload.role;
        socket.userName = payload.name;

        console.log(`✅ Chat socket authenticated: ${socket.userName} (${socket.userRole})`);
        next();
      } catch (error) {
        console.error('❌ Chat socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    // Connection handler
    chatNamespace.on('connection', (socket: AuthenticatedSocket) => {
      this.handleConnection(socket);
    });
  }

  private handleConnection(socket: AuthenticatedSocket) {
    console.log(`💬 Chat user connected: ${socket.userName} (${socket.userRole}) - Socket: ${socket.id}`);

    if (!socket.userId) return;

    // Store user mappings
    this.userSockets.set(socket.userId, socket.id);
    this.socketToUser.set(socket.id, socket.userId);

    // Update online status
    this.onlineUsers.set(socket.userId, {
      userId: socket.userId,
      isOnline: true,
      lastSeen: new Date()
    });

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Broadcast online status
    this.broadcastOnlineStatus(socket.userId, true);

    // Event handlers
    this.setupChatEvents(socket);
    this.setupTypingEvents(socket);
    this.setupRoomEvents(socket);
    this.setupStatusEvents(socket);

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });
  }

  private setupChatEvents(socket: AuthenticatedSocket) {
    // Send message
    socket.on('chat:sendMessage', async (data: {
      roomId: string;
      message: string;
      messageType?: 'text' | 'image' | 'file';
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
    }) => {
      console.log(`📤 Message from ${socket.userName} in room ${data.roomId}`);

      try {
        // Emit to all users in the room including sender for consistency
        this.io.of('/chat').to(data.roomId).emit('chat:newMessage', {
          roomId: data.roomId,
          senderId: socket.userId,
          senderName: socket.userName,
          senderType: socket.userRole,
          message: data.message,
          messageType: data.messageType || 'text',
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
          timestamp: new Date(),
          status: 'sent'
        });

        console.log(`✅ Message delivered to room ${data.roomId}`);
      } catch (error) {
        console.error('❌ Error sending message:', error);
        socket.emit('chat:error', { message: 'Failed to send message' });
      }
    });

    // Mark messages as read
    socket.on('chat:markAsRead', (data: { roomId: string; messageIds: string[] }) => {
      console.log(`👁️ ${socket.userName} marked messages as read in ${data.roomId}`);

      this.io.of('/chat').to(data.roomId).emit('chat:messagesRead', {
        roomId: data.roomId,
        readBy: socket.userId,
        readByRole: socket.userRole,
        messageIds: data.messageIds,
        timestamp: new Date()
      });
    });

    // Delete message
    socket.on('chat:deleteMessage', (data: { roomId: string; messageId: string }) => {
      console.log(`🗑️ ${socket.userName} deleted message ${data.messageId}`);

      this.io.of('/chat').to(data.roomId).emit('chat:messageDeleted', {
        roomId: data.roomId,
        messageId: data.messageId,
        deletedBy: socket.userId,
        timestamp: new Date()
      });
    });
  }

  private setupTypingEvents(socket: AuthenticatedSocket) {
    // Typing start
    socket.on('chat:typingStart', (data: { roomId: string }) => {
      console.log(`⌨️ ${socket.userName} started typing in ${data.roomId}`);

      if (!this.typingUsers.has(data.roomId)) {
        this.typingUsers.set(data.roomId, new Set());
      }
      this.typingUsers.get(data.roomId)!.add(socket.userId!);

      // Broadcast to others in room (not sender)
      socket.to(data.roomId).emit('chat:userTyping', {
        roomId: data.roomId,
        userId: socket.userId,
        userName: socket.userName,
        userRole: socket.userRole,
        isTyping: true
      });
    });

    // Typing stop
    socket.on('chat:typingStop', (data: { roomId: string }) => {
      console.log(`⌨️ ${socket.userName} stopped typing in ${data.roomId}`);

      const typingSet = this.typingUsers.get(data.roomId);
      if (typingSet) {
        typingSet.delete(socket.userId!);
        if (typingSet.size === 0) {
          this.typingUsers.delete(data.roomId);
        }
      }

      socket.to(data.roomId).emit('chat:userTyping', {
        roomId: data.roomId,
        userId: socket.userId,
        userName: socket.userName,
        userRole: socket.userRole,
        isTyping: false
      });
    });
  }

  private setupRoomEvents(socket: AuthenticatedSocket) {
    // Join chat room
    socket.on('chat:joinRoom', (data: { roomId: string; otherUserId?: string }) => {
      console.log(`🚪 ${socket.userName} joining room ${data.roomId}`);

      socket.join(data.roomId);

      if (!this.roomUsers.has(data.roomId)) {
        this.roomUsers.set(data.roomId, new Set());
      }
      this.roomUsers.get(data.roomId)!.add(socket.userId!);

      // Notify room members
      socket.to(data.roomId).emit('chat:userJoined', {
        roomId: data.roomId,
        userId: socket.userId,
        userName: socket.userName,
        userRole: socket.userRole,
        timestamp: new Date()
      });

      // Send online status of other user if provided
      if (data.otherUserId) {
        const otherUserStatus = this.onlineUsers.get(data.otherUserId);
        socket.emit('chat:userStatus', {
          userId: data.otherUserId,
          isOnline: otherUserStatus?.isOnline || false,
          lastSeen: otherUserStatus?.lastSeen || new Date()
        });
      }

      console.log(`✅ ${socket.userName} joined room ${data.roomId}`);
    });

    // Leave chat room
    socket.on('chat:leaveRoom', (data: { roomId: string }) => {
      console.log(`🚪 ${socket.userName} leaving room ${data.roomId}`);

      socket.leave(data.roomId);

      const roomUserSet = this.roomUsers.get(data.roomId);
      if (roomUserSet) {
        roomUserSet.delete(socket.userId!);
        if (roomUserSet.size === 0) {
          this.roomUsers.delete(data.roomId);
        }
      }

      // Remove from typing users
      const typingSet = this.typingUsers.get(data.roomId);
      if (typingSet) {
        typingSet.delete(socket.userId!);
      }

      socket.to(data.roomId).emit('chat:userLeft', {
        roomId: data.roomId,
        userId: socket.userId,
        userName: socket.userName,
        timestamp: new Date()
      });
    });
  }

  private setupStatusEvents(socket: AuthenticatedSocket) {
    // Request online status
    socket.on('chat:requestStatus', (data: { userIds: string[] }) => {
      const statuses = data.userIds.map(userId => {
        const status = this.onlineUsers.get(userId);
        return {
          userId,
          isOnline: status?.isOnline || false,
          lastSeen: status?.lastSeen || new Date()
        };
      });

      socket.emit('chat:statusUpdate', { statuses });
    });
  }

  private handleDisconnection(socket: AuthenticatedSocket) {
    console.log(`💬 Chat user disconnected: ${socket.userName}`);

    if (!socket.userId) return;

    // Update online status
    this.onlineUsers.set(socket.userId, {
      userId: socket.userId,
      isOnline: false,
      lastSeen: new Date()
    });

    // Broadcast offline status
    this.broadcastOnlineStatus(socket.userId, false);

    // Clean up mappings
    this.userSockets.delete(socket.userId);
    this.socketToUser.delete(socket.id);

    // Remove from all rooms
    this.roomUsers.forEach((users, roomId) => {
      if (users.has(socket.userId!)) {
        users.delete(socket.userId!);
        this.io.of('/chat').to(roomId).emit('chat:userLeft', {
          roomId,
          userId: socket.userId,
          userName: socket.userName,
          timestamp: new Date()
        });
      }
    });

    // Remove from typing users
    this.typingUsers.forEach((users, roomId) => {
      if (users.has(socket.userId!)) {
        users.delete(socket.userId!);
        this.io.of('/chat').to(roomId).emit('chat:userTyping', {
          roomId,
          userId: socket.userId,
          isTyping: false
        });
      }
    });
  }

  private broadcastOnlineStatus(userId: string, isOnline: boolean) {
    const status = this.onlineUsers.get(userId);
    if (status) {
      this.io.of('/chat').emit('chat:userStatusChange', {
        userId,
        isOnline,
        lastSeen: status.lastSeen
      });
    }
  }

  // Public methods for external use

  public sendMessageToUser(userId: string, event: string, data: any): boolean {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.of('/chat').to(socketId).emit(event, data);
      console.log(`📨 Chat event ${event} sent to user ${userId}`);
      return true;
    }
    console.log(`⚠️ User ${userId} not connected to chat`);
    return false;
  }

  public sendMessageToRoom(roomId: string, event: string, data: any): void {
    this.io.of('/chat').to(roomId).emit(event, data);
    console.log(`📨 Chat event ${event} sent to room ${roomId}`);
  }

  public isUserOnline(userId: string): boolean {
    return this.onlineUsers.get(userId)?.isOnline || false;
  }

  public getUserStatus(userId: string): OnlineStatus | undefined {
    return this.onlineUsers.get(userId);
  }

  public getRoomUsers(roomId: string): string[] {
    return Array.from(this.roomUsers.get(roomId) || []);
  }

  public getOnlineUsersCount(): number {
    return Array.from(this.onlineUsers.values()).filter(s => s.isOnline).length;
  }

  public getChatStats() {
    return {
      onlineUsers: this.getOnlineUsersCount(),
      totalRooms: this.roomUsers.size,
      activeTyping: this.typingUsers.size
    };
  }
}