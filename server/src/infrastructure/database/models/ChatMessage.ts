import mongoose, { Schema } from 'mongoose';
import { ChatMessage } from '../../../domain/entities/ChatMessage.entity';
const ChatMessageSchema = new Schema<ChatMessage>(
  {
    chatRoomId: { type: Schema.Types.ObjectId, ref: 'ChatRoom', required: true, index: true },
    senderId: { type: String, required: true },
    senderType: { type: String, enum: ['doctor', 'patient'], required: true },
    message: { type: String, required: true },
    messageType: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
    fileUrl: { type: String },
    fileName: { type: String },
    fileSize: { type: Number },
    isRead: { type: Boolean, default: false },
    readBy: {
      doctor: { type: Date },
      patient: { type: Date },
    },
  },
  { timestamps: true }
);

// Compound index for efficient message retrieval
ChatMessageSchema.index({ chatRoomId: 1, createdAt: -1 });
ChatMessageSchema.index({ chatRoomId: 1, isRead: 1 });

export const ChatMessageModel = mongoose.model<ChatMessage>('ChatMessage', ChatMessageSchema);