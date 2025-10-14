

export interface ChatRoom {
  id: string;
  doctorId: string;
  patientId: string;
  doctorName?: string;
  patientName?: string;
  doctorImage?: string;
  patientImage?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  isActive: boolean;
  expiresAt: Date;
  lastAppointmentDate: Date;
  isOnline?: boolean;
}

export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderType: 'doctor' | 'patient';
  message: string;
  messageType: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead: boolean;
  readBy?: {
    doctor?: Date;
    patient?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface TypingStatus {
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface OnlineStatus {
  userId: string;
  isOnline: boolean;
}