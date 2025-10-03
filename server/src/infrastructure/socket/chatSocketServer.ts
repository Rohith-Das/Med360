import { Socket, Server } from "socket.io";
import { Server as HttpServer } from "http";
import { container } from "tsyringe";
import { AuthService } from "../../application/service/AuthService";
import { TokenPayload } from "../../shared/AuthType";
import { MarkMessagesReadUC } from "../../application/Chats/MarkMessagesReadUC";
import { IChatRepository } from "../../domain/repositories/ChatRepository";
import { GetMessagesUC } from "../../application/Chats/GetMessagesUC";
import { SendMessageUC } from "../../application/Chats/SendMessageUC";

interface AuthenticatedChatSocket extends Socket {
  userId?: string;
  userRole?: 'doctor' | 'patient';
  userName?: string;
}

interface ChatMessageData {
  chatRoomId: string; // This should be in format "doctorId_patientId"
  message: string;
  messageType: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

interface TypingData {
  chatRoomId: string;
  isTyping: boolean;
}

export class ChatSocketServer {
  private io: Server;
  private connectedUsers = new Map<string, string>(); // userId -> socketId
  private userSocket = new Map<string, string>(); // socketId -> userId
  private chatRooms = new Map<string, Set<string>>(); // chatRoomId -> Set of socketIds
  private typingUsers = new Map<string, Set<string>>(); // chatRoomId -> Set of typing userIds
  private onlineUsers = new Set<string>();
  private sendMessageUC: SendMessageUC;
  private markReadUC: MarkMessagesReadUC;
  private getMessagesUC: GetMessagesUC;
  private chatRepository: IChatRepository;

  constructor(httpServer: HttpServer, path: string = '/chat-socket') {
    this.io = new Server(httpServer, {
      path,
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });
    
    this.sendMessageUC = container.resolve(SendMessageUC);
    this.markReadUC = container.resolve(MarkMessagesReadUC);
    this.getMessagesUC = container.resolve(GetMessagesUC);
    this.chatRepository = container.resolve<IChatRepository>('IChatRepository');
    
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use(async (socket: any, next) => {
      try {
        const token = socket.handshake.auth.token;
        console.log('Chat socket auth token received');
        
        if (!token) {
          return next(new Error('Authentication token missing'));
        }

        const authService = container.resolve<AuthService>('AuthService');
        let payload: TokenPayload;

        try {
          payload = authService.verifyAccessToken(token);
        } catch {
          try {
            payload = authService.verifyDoctorAccessToken(token);
          } catch (error) {
            return next(new Error('Invalid authentication tokens'));
          }
        }

        socket.userId = payload.userId;
        socket.userRole = payload.role === 'patient' ? 'patient' : 'doctor';
        socket.userName = payload.name;
        
        console.log(`Chat socket authenticated: ${socket.userName} (${socket.userRole})`);
        next();
      } catch (error) {
        console.error('Chat socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedChatSocket) => {
      console.log(`Chat user connected: ${socket.userName} (${socket.userRole}), socket: ${socket.id}`);
      
      if (socket.userId) {
        this.connectedUsers.set(socket.userId, socket.id);
        this.userSocket.set(socket.id, socket.userId);
        this.onlineUsers.add(socket.userId);

        // Join user's personal room for notifications
        socket.join(`user_${socket.userId}`);
        
        // Notify about online status
        this.broadcastOnlineStatus(socket.userId, socket.userName!, socket.userRole!, true);

        // Chat room management
        socket.on('chat:join-room', (data: { chatRoomId: string }) => {
          this.handleJoinRoom(socket, data.chatRoomId);
        });

        socket.on('chat:leave-room', (data: { chatRoomId: string }) => {
          this.handleLeaveRoom(socket, data.chatRoomId);
        });

        // Message handlers
        socket.on('chat:send-message', async (data: ChatMessageData) => {
          await this.handleSendMessage(socket, data);
        });

        socket.on('chat:get-messages', async (data: { chatRoomId: string; limit?: number }) => {
          await this.handleGetMessages(socket, data);
        });

        // Typing indicators
        socket.on('chat:typing-start', (data: TypingData) => {
          this.handleTyping(socket, data.chatRoomId, true);
        });

        socket.on('chat:typing-stop', (data: TypingData) => {
          this.handleTyping(socket, data.chatRoomId, false);
        });

        // Read receipts
        socket.on('chat:mark-messages-read', async (data: { chatRoomId: string }) => {
          await this.handleMarkMessagesRead(socket, data.chatRoomId);
        });

        // File upload progress
        socket.on('chat:file-upload-progress', (data: {
          chatRoomId: string;
          progress: number;
          fileName: string;
          uploadId: string;
        }) => {
          this.handleFileUploadProgress(socket, data);
        });

        // Disconnect handler
        socket.on('disconnect', () => {
          this.handleDisconnect(socket);
        });

        socket.on('error', (error) => {
          console.error(`Socket error for ${socket.userName}:`, error);
        });
      }
    });
  }

  private async handleSendMessage(socket: AuthenticatedChatSocket, data: ChatMessageData) {
    try {
      console.log(`Message received from ${socket.userName} in room ${data.chatRoomId}`);
      
      // Extract doctorId and patientId from chatRoomId format "doctorId_patientId"
      const [doctorId, patientId] = data.chatRoomId.split('_');
      
      if (!doctorId || !patientId) {
        throw new Error('Invalid chat room ID format');
      }

      // Determine participant ID based on sender role
      const participantId = socket.userRole === 'patient' ? doctorId : patientId;

      // Send message using use case
      const chatMessage = await this.sendMessageUC.execute({
        participantId,
        senderId: socket.userId!,
        senderType: socket.userRole!,
        message: data.message,
        messageType: data.messageType,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
      });

      console.log(`Message persisted and sent in room ${data.chatRoomId} by ${socket.userName}`);

      // Emit success confirmation to sender
      socket.emit('chat:message-sent', {
        messageId: chatMessage.id,
        temporaryId: data.chatRoomId, // You might want to send a temporary ID from client
        timestamp: new Date().toISOString(),
      });

    } catch (error: any) {
      console.error('Socket send message error:', error);
      socket.emit('chat:error', { 
        message: error.message || 'Failed to send message',
        code: 'SEND_MESSAGE_FAILED'
      });
    }
  }

  private async handleGetMessages(socket: AuthenticatedChatSocket, data: { chatRoomId: string; limit?: number }) {
    try {
      const [doctorId, patientId] = data.chatRoomId.split('_');
      const chatRoom = await this.chatRepository.findChatRoom(doctorId, patientId);
      
      if (!chatRoom) {
        socket.emit('chat:error', { message: 'Chat room not found' });
        return;
      }

      const messages = await this.getMessagesUC.execute({
        chatRoomId: chatRoom.id,
        userId: socket.userId!,
        userType: socket.userRole!,
        limit: data.limit || 50,
        skip: 0,
      });

      socket.emit('chat:messages-history', {
        chatRoomId: data.chatRoomId,
        messages: messages.messages,
        hasMore: messages.messages.length === (data.limit || 50),
      });

    } catch (error: any) {
      console.error('Get messages error:', error);
      socket.emit('chat:error', { 
        message: error.message || 'Failed to fetch messages',
        code: 'FETCH_MESSAGES_FAILED'
      });
    }
  }

  private handleJoinRoom(socket: AuthenticatedChatSocket, chatRoomId: string) {
    const roomId = `chat_${chatRoomId}`;
    socket.join(roomId);
    
    if (!this.chatRooms.has(chatRoomId)) {
      this.chatRooms.set(chatRoomId, new Set());
    }
    this.chatRooms.get(chatRoomId)!.add(socket.id);

    console.log(`${socket.userName} joined chat room: ${chatRoomId}`);

    // Notify other participants
    socket.to(roomId).emit('chat:user-joined', {
      userId: socket.userId,
      userName: socket.userName,
      userRole: socket.userRole,
      timestamp: new Date().toISOString(),
    });

    // Send current room participants to the joining user
    const roomParticipants = Array.from(this.chatRooms.get(chatRoomId)!)
      .map(socketId => {
        const userId = this.userSocket.get(socketId);
        const userSocket = this.io.sockets.sockets.get(socketId) as AuthenticatedChatSocket;
        return userId ? { 
          userId, 
          socketId,
          userName: userSocket?.userName,
          userRole: userSocket?.userRole
        } : null;
      })
      .filter(Boolean);

    socket.emit('chat:room-joined', {
      chatRoomId,
      participants: roomParticipants,
      participantCount: roomParticipants.length,
    });
  }

  private handleLeaveRoom(socket: AuthenticatedChatSocket, chatRoomId: string) {
    const roomId = `chat_${chatRoomId}`;
    
    if (this.chatRooms.has(chatRoomId)) {
      this.chatRooms.get(chatRoomId)!.delete(socket.id);
      if (this.chatRooms.get(chatRoomId)!.size === 0) {
        this.chatRooms.delete(chatRoomId);
      }
    }

    socket.leave(roomId);
    console.log(`${socket.userName} left chat room: ${chatRoomId}`);

    // Notify other participants
    socket.to(roomId).emit('chat:user-left', {
      userId: socket.userId,
      userName: socket.userName,
      userRole: socket.userRole,
      timestamp: new Date().toISOString(),
    });
  }

  private handleTyping(socket: AuthenticatedChatSocket, chatRoomId: string, isTyping: boolean) {
    const roomId = `chat_${chatRoomId}`;
    
    if (isTyping) {
      const typingSet = this.typingUsers.get(chatRoomId) || new Set();
      typingSet.add(socket.userId!);
      this.typingUsers.set(chatRoomId, typingSet);
    } else {
      const typingSet = this.typingUsers.get(chatRoomId);
      if (typingSet) {
        typingSet.delete(socket.userId!);
        if (typingSet.size === 0) {
          this.typingUsers.delete(chatRoomId);
        }
      }
    }

    socket.to(roomId).emit(isTyping ? 'chat:user-typing' : 'chat:user-stopped-typing', {
      userId: socket.userId,
      userName: socket.userName,
      userRole: socket.userRole,
      chatRoomId,
      timestamp: new Date().toISOString(),
    });
  }

  private async handleMarkMessagesRead(socket: AuthenticatedChatSocket, chatRoomId: string) {
    try {
      const [doctorId, patientId] = chatRoomId.split('_');
      const chatRoom = await this.chatRepository.findChatRoom(doctorId, patientId);
      
      if (!chatRoom) {
        throw new Error('Chat room not found');
      }

      const markedCount = await this.markReadUC.execute(
        chatRoom.id, 
        socket.userId!, 
        socket.userRole!
      );

      const roomId = `chat_${chatRoomId}`;
      socket.to(roomId).emit('chat:messages-read', {
        userId: socket.userId,
        userName: socket.userName,
        userRole: socket.userRole,
        chatRoomId,
        markedCount,
        timestamp: new Date().toISOString(),
      });

      console.log(`${socket.userName} marked ${markedCount} messages as read in ${chatRoomId}`);

    } catch (error: any) {
      console.error('Mark messages read error:', error);
      socket.emit('chat:error', { 
        message: error.message || 'Failed to mark messages as read',
        code: 'MARK_READ_FAILED'
      });
    }
  }

  private handleFileUploadProgress(socket: AuthenticatedChatSocket, data: {
    chatRoomId: string;
    progress: number;
    fileName: string;
    uploadId: string;
  }) {
    const roomId = `chat_${data.chatRoomId}`;
    
    socket.to(roomId).emit('chat:file-upload-progress', {
      userId: socket.userId,
      userName: socket.userName,
      progress: data.progress,
      fileName: data.fileName,
      uploadId: data.uploadId,
      chatRoomId: data.chatRoomId,
    });
  }

  private handleDisconnect(socket: AuthenticatedChatSocket) {
    console.log(`Chat user disconnected: ${socket.userName} (${socket.userId})`);

    if (socket.userId) {
      // Clean up user mappings
      this.connectedUsers.delete(socket.userId);
      this.userSocket.delete(socket.id);
      this.onlineUsers.delete(socket.userId);

      // Clean up typing indicators
      for (const [chatRoomId, typingSet] of this.typingUsers.entries()) {
        typingSet.delete(socket.userId);
        if (typingSet.size === 0) {
          this.typingUsers.delete(chatRoomId);
        }
      }

      // Clean up chat rooms and notify participants
      for (const [chatRoomId, participants] of this.chatRooms.entries()) {
        if (participants.has(socket.id)) {
          participants.delete(socket.id);

          const roomId = `chat_${chatRoomId}`;
          socket.to(roomId).emit('chat:user-left', {
            userId: socket.userId,
            userName: socket.userName,
            userRole: socket.userRole,
            timestamp: new Date().toISOString(),
            reason: 'disconnected'
          });

          if (participants.size === 0) {
            this.chatRooms.delete(chatRoomId);
          }
        }
      }

      // Notify about offline status
      this.broadcastOnlineStatus(socket.userId, socket.userName!, socket.userRole!, false);
    }
  }

  private broadcastOnlineStatus(userId: string, userName: string, userRole: 'doctor' | 'patient', isOnline: boolean) {
    const event = isOnline ? 'chat:user-online' : 'chat:user-offline';
    const data = {
      userId,
      userName,
      userRole,
      timestamp: new Date().toISOString(),
    };

    // Notify all chat rooms this user is part of
    for (const [chatRoomId, participants] of this.chatRooms.entries()) {
      if (Array.from(participants).some(socketId => this.userSocket.get(socketId) === userId)) {
        const roomId = `chat_${chatRoomId}`;
        this.io.to(roomId).emit(event, data);
      }
    }
  }

  // Public methods for external use
  public sendMessageToRoom(chatRoomId: string, messageData: any): void {
    const roomId = `chat_${chatRoomId}`;
    this.io.to(roomId).emit('chat:new-message', {
      ...messageData,
      timestamp: new Date().toISOString(),
    });
  }

  public sendToUser(userId: string, event: string, data: any): boolean {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, {
        ...data,
        timestamp: new Date().toISOString(),
      });
      return true;
    }
    return false;
  }

  public notifyFileUploadComplete(chatRoomId: string, fileData: any): void {
    const roomId = `chat_${chatRoomId}`;
    this.io.to(roomId).emit('chat:file-upload-complete', {
      ...fileData,
      timestamp: new Date().toISOString(),
    });
  }

  public getRoomParticipants(chatRoomId: string): Array<{ userId: string; userName?: string; userRole?: string }> {
    const participants = this.chatRooms.get(chatRoomId);
    if (!participants) return [];

    return Array.from(participants)
      .map(socketId => {
        const userId = this.userSocket.get(socketId);
        const socket = this.io.sockets.sockets.get(socketId) as AuthenticatedChatSocket;
        return userId ? { 
          userId, 
          userName: socket?.userName,
          userRole: socket?.userRole 
        } : null;
      })
      .filter(Boolean) as Array<{ userId: string; userName?: string; userRole?: string }>;
  }

  public isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  public getOnlineUsers(): string[] {
    return Array.from(this.onlineUsers);
  }

  public getChatRoomCount(): number {
    return this.chatRooms.size;
  }

  public getChatStats() {
    return {
      connectedUsers: this.connectedUsers.size,
      activeChatRooms: this.chatRooms.size,
      onlineUsers: this.onlineUsers.size,
      typingSessions: this.typingUsers.size,
      totalSockets: this.io.engine.clientsCount,
    };
  }

  public getIO(): Server {
    return this.io;
  }
}

// Singleton instance management
let chatSocketServer: ChatSocketServer;

export const initializeChatSocketServer = (httpServer: HttpServer): ChatSocketServer => {
  chatSocketServer = new ChatSocketServer(httpServer, '/chat-socket');
  console.log('Chat socket server initialized on /chat-socket path');
  return chatSocketServer;
};

export const getChatSocketServer = (): ChatSocketServer => {
  if (!chatSocketServer) {
    throw new Error('Chat socket server not initialized. Call initializeChatSocketServer first.');
  }
  return chatSocketServer;
};