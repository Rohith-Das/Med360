import mongoose,{Schema} from "mongoose";
import { ChatMessage } from '../../../domain/entities/ChatMessage.enity';

const ChatMessageSchema = new Schema<ChatMessage>(
  {
    appointmentId: { type: String, required: true, index: true },
    senderId: { type: String, required: true, index: true },
    senderType: { 
      type: String, 
      enum: ['doctor', 'patient'], 
      required: true 
    },
    receiverId: { type: String, required: true, index: true },
    receiverType: { 
      type: String, 
      enum: ['doctor', 'patient'], 
      required: true 
    },
    message: { type: String, required: true },
    messageType: { 
      type: String, 
      enum: ['text', 'image', 'file'], 
      default: 'text' 
    },
    fileUrl: { type: String },
    fileName: { type: String },
    fileSize: { type: Number },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date }
  },
  { 
    timestamps: true,
   
  }
);

export const ChatMessageModel = mongoose.model<ChatMessage>('ChatMessage', ChatMessageSchema);
