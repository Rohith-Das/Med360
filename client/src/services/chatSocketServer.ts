// client/src/features/chat/chatSocket.ts
import { io, Socket } from 'socket.io-client';
import { store } from '@/app/store';
import { toast } from 'react-toastify';

interface ChatMessage {
  roomId: string;
  senderId: string;
  senderName: string;
  senderType: 'doctor' | 'patient';
  message: string;
  messageType?: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  timestamp: Date;
  status: string;
}

interface UserStatus {
  userId: string;
  isOnline: boolean;
  lastSeen: Date;
}

class ChatSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private messageHandlers: Map<string, (message: ChatMessage) => void> = new Map();
  private statusHandlers: Map<string, (status: UserStatus) => void> = new Map();
  private typingHandlers: Map<string, (data: any) => void> = new Map();

  connect(userId: string, role: 'doctor' | 'patient') {
    if (this.socket?.connected) {
      console.log('💬 Chat socket already connected');
      return;
    }

    const token = role === 'doctor' 
      ? store.getState().doctorAuth.doctorAccessToken 
      : store.getState().auth.accessToken;

    if (!token) {
      console.error('❌ No authentication token available for chat');
      return;
    }

    console.log(`🔌 Connecting chat socket for ${role}: ${userId}`);

    // Connect to your existing /chat namespace
    this.socket = io('http://localhost:5001/chat', {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    this.setupEventHandlers(role, userId);
  }

  private setupEventHandlers(role: 'doctor' | 'patient', userId: string) {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log(`✅ Chat socket connected for ${role}: ${userId}`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      toast.success('Chat connected', { autoClose: 2000 });
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`❌ Chat socket disconnected: ${reason}`);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('💬 Chat socket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        toast.error('Unable to connect to chat service');
      }
    });

    // Chat message events - matching your chatSocketServer.ts events
    this.socket.on('chat:newMessage', (message: ChatMessage) => {
      console.log('💬 New message received:', message);
      this.messageHandlers.forEach(handler => handler(message));
      
      if (message.senderId !== userId) {
        toast.info(`New message from ${message.senderName}`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    });

    this.socket.on('chat:userStatusChange', (status: UserStatus) => {
      console.log('👤 User status changed:', status);
      this.statusHandlers.forEach(handler => handler(status));
    });

    this.socket.on('chat:userStatus', (status: UserStatus) => {
      console.log('👤 User status received:', status);
      this.statusHandlers.forEach(handler => handler(status));
    });

    this.socket.on('chat:userTyping', (data: any) => {
      console.log('⌨️ User typing event:', data);
      this.typingHandlers.forEach(handler => handler(data));
    });

    this.socket.on('chat:userJoined', (data: any) => {
      console.log('🚪 User joined room:', data);
    });

    this.socket.on('chat:userLeft', (data: any) => {
      console.log('🚪 User left room:', data);
    });

    this.socket.on('chat:messagesRead', (data: any) => {
      console.log('👁️ Messages marked as read:', data);
    });

    this.socket.on('chat:error', (error: any) => {
      console.error('❌ Chat error:', error);
      toast.error(error.message || 'Chat error occurred');
    });
  }

  // Public methods matching your chatSocketServer.ts events

  joinRoom(roomId: string, otherUserId?: string) {
    if (this.socket?.connected) {
      console.log(`🚪 Joining chat room ${roomId}`);
      this.socket.emit('chat:joinRoom', { roomId, otherUserId });
    } else {
      console.warn('⚠️ Cannot join room: chat socket not connected');
      toast.error('Chat not connected. Please refresh the page.');
    }
  }

  leaveRoom(roomId: string) {
    if (this.socket?.connected) {
      console.log(`🚪 Leaving chat room ${roomId}`);
      this.socket.emit('chat:leaveRoom', { roomId });
    }
  }

  sendMessage(data: {
    roomId: string;
    message: string;
    messageType?: 'text' | 'image' | 'file';
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
  }) {
    if (this.socket?.connected) {
      console.log(`📤 Sending message to room ${data.roomId}`);
      this.socket.emit('chat:sendMessage', data);
    } else {
      console.warn('⚠️ Cannot send message: chat socket not connected');
      toast.error('Chat not connected. Please refresh the page.');
    }
  }

  startTyping(roomId: string) {
    if (this.socket?.connected) {
      this.socket.emit('chat:typingStart', { roomId });
    }
  }

  stopTyping(roomId: string) {
    if (this.socket?.connected) {
      this.socket.emit('chat:typingStop', { roomId });
    }
  }

  markAsRead(roomId: string, messageIds: string[]) {
    if (this.socket?.connected) {
      this.socket.emit('chat:markAsRead', { roomId, messageIds });
    }
  }

  requestStatus(userIds: string[]) {
    if (this.socket?.connected) {
      this.socket.emit('chat:requestStatus', { userIds });
    }
  }

  // Event handler registration
  onNewMessage(handler: (message: ChatMessage) => void): () => void {
    const id = Math.random().toString(36);
    this.messageHandlers.set(id, handler);
    return () => this.messageHandlers.delete(id);
  }

  onUserStatus(handler: (status: UserStatus) => void): () => void {
    const id = Math.random().toString(36);
    this.statusHandlers.set(id, handler);
    return () => this.statusHandlers.delete(id);
  }

  onTyping(handler: (data: any) => void): () => void {
    const id = Math.random().toString(36);
    this.typingHandlers.set(id, handler);
    return () => this.typingHandlers.delete(id);
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting chat socket');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
      this.messageHandlers.clear();
      this.statusHandlers.clear();
      this.typingHandlers.clear();
    }
  }

  isSocketConnected(): boolean {
    return this.isConnected && !!this.socket?.connected;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

// Export singleton instance
export const chatSocketService = new ChatSocketService();