// src/types/chat.ts
export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderName?: string;
  senderType: 'doctor' | 'patient';
  messageType: 'text' | 'image' | 'file';
  message: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead: boolean;
  readBy?: {
    doctor?: Date;
    patient?: Date;
  };
  status: 'sent' | 'delivered' | 'seen' | 'sending' | 'failed';
  timestamp?: Date;
  createdAt: string;
  updatedAt: string;
}

export interface UserStatus {
  userId: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export interface TypingData {
  roomId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}