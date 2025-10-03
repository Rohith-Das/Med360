
import mongoose,{Schema,Document} from "mongoose";
export type MessageType = 'text' | 'image' | 'file';

export interface ChatMessage {
  id: string;
  chatRoomId: string|mongoose.Types.ObjectId;
  senderId: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMessageInput {
  chatRoomId: string;
  senderId: string;
  senderType: 'doctor' | 'patient';
  message: string;
  messageType: MessageType;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}