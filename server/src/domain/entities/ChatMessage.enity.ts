export interface ChatMessage {
  id?: string;
  appointmentId: string;
  senderId: string;
  senderType: 'doctor' | 'patient';
  receiverId: string;
  receiverType: 'doctor' | 'patient';
  message: string;
  messageType: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead: boolean;
  readAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChatRoom {
  id?: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCountPatient: number;
  unreadCountDoctor: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}