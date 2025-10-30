import mongoose from "mongoose";
export type MessageType = 'text' | 'image' | 'file';
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface ChatMessage {
  id?: string;
  chatRoomId: string | mongoose.Types.ObjectId;
  senderId: string | mongoose.Types.ObjectId; 
  senderType: 'doctor' | 'patient';
  message: string;
  messageType: MessageType;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead: boolean;
  readBy?: {
    doctor?: Date;
    patient?: Date;
  };
  createdAt?: Date;
  updatedAt?: Date;
    status?: MessageStatus;
}
