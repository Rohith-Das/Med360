// src/services/chatSocketServer.ts
import { io, Socket } from 'socket.io-client';

class ChatSocketService {
  private socket: Socket | null = null;
  private connected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  connect(userId: string, role: 'doctor' | 'patient', accessToken: string) {
    if (this.socket?.connected) {
      console.log('Chat socket already connected');
      return;
    }

    console.log(`🔌 Connecting chat socket for ${role}: ${userId}`);

    this.socket = io('http://localhost:5001', {
      path: '/chat-socket',
      auth: { userId, role, token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on('connect', () => {
      console.log('✅ Chat socket connected:', this.socket?.id);
      this.connected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Chat socket disconnected:', reason);
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Chat socket connection error:', error.message);
      this.connected = false;
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    // Listen for room join confirmation
    this.socket.on('chat:room-joined', (data) => {
      console.log('✅ Joined chat room:', data);
    });

    // Listen for message sent confirmation
    this.socket.on('chat:message-sent', (data) => {
      console.log('✅ Message sent confirmed:', data);
    });

    // Listen for errors
    this.socket.on('chat:error', (error) => {
      console.error('❌ Chat error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting chat socket');
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.reconnectAttempts = 0;
    }
  }

  isConnected(): boolean {
    return this.connected && this.socket?.connected === true;
  }

  // Join a specific chat room
  joinChatRoom(chatRoomId: string, userId: string, role: 'doctor' | 'patient') {
    if (!this.isConnected()) {
      console.error('Socket not connected, retrying after delay...');
      setTimeout(() => {
        if (this.isConnected()) {
          this.socket!.emit('chat:join-room', { chatRoomId, userId, role });
          console.log('📥 Joined chat room:', chatRoomId);
        } else {
          console.error('Socket still not connected after retry');
        }
      }, 1000);
      return;
    }
    this.socket!.emit('chat:join-room', { chatRoomId, userId, role });
    console.log('📥 Joined chat room:', chatRoomId);
  }

  // Leave a chat room
  leaveChatRoom(chatRoomId: string) {
    if (!this.socket?.connected) {
      console.warn('Cannot leave room: Socket not connected');
      return;
    }
    this.socket.emit('chat:leave-room', { chatRoomId });
    console.log('📤 Left chat room:', chatRoomId);
  }

  // Send a message
  sendMessage(data: {
    chatRoomId: string;
    senderId: string;
    senderRole: 'doctor' | 'patient';
    message: string;
    messageType?: 'text' | 'image' | 'file';
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
  }) {
    if (!this.socket?.connected) {
      console.error('Cannot send message: Socket not connected');
      throw new Error('Socket not connected');
    }
    
    console.log('📤 Sending message:', data);
    this.socket.emit('chat:send-message', data);
  }

  // Emit typing indicator
  emitTyping(chatRoomId: string, userId: string, isTyping: boolean) {
    if (!this.socket?.connected) {
      console.warn('Cannot emit typing: Socket not connected');
      return;
    }
    
    const event = isTyping ? 'chat:typing-start' : 'chat:typing-stop';
    this.socket.emit(event, { chatRoomId, userId, isTyping });
  }

  // Mark messages as read
  markAsRead(chatRoomId: string, userId: string, userRole: 'doctor' | 'patient') {
    if (!this.socket?.connected) {
      console.warn('Cannot mark as read: Socket not connected');
      return;
    }
    this.socket.emit('chat:mark-messages-read', { chatRoomId, userId, userRole });
  }

  // Listen for events
  on(event: string, callback: (data: any) => void) {
    if (!this.socket) {
      console.warn(`Cannot listen to ${event}: Socket not initialized`);
      return;
    }
    this.socket.on(event, callback);
  }

  // Remove event listener
  off(event: string, callback?: (data: any) => void) {
    if (!this.socket) return;
    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  // Get socket instance
  getSocket(): Socket | null {
    return this.socket;
  }

  // Get connection status
  getConnectionStatus(): {
    connected: boolean;
    socketId?: string;
    reconnectAttempts: number;
  } {
    return {
      connected: this.connected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

export const chatSocketService = new ChatSocketService();