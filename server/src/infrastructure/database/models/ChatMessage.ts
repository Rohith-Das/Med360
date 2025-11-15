import mongoose, { Schema } from 'mongoose';
import { ChatMessage } from '../../../domain/entities/ChatMessage.entity';

const ChatMessageSchema = new Schema({
  chatRoomId: { type: Schema.Types.ObjectId, ref: 'ChatRoom', required: true },
  senderId: { type: Schema.Types.ObjectId, required: true },
  senderType: { type: String, enum: ['doctor', 'patient'], required: true },
  message: { type: String, required: true },
  messageType: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
  fileUrl: String,
  fileName: String,
  fileSize: Number,
  isRead: { type: Boolean, default: false },
  readBy: {
    doctor: Date,
    patient: Date,
  },
  status: { type: String, enum: ['sent', 'delivered', 'seen', 'sending', 'failed'], default: 'sent' },
  timestamp: Date,
}, { timestamps: true });

// Virtual populate with dynamic ref
ChatMessageSchema.virtual('sender', {
  ref: (doc: any) => doc.senderType === 'doctor' ? 'Doctor' : 'Patient', // ← FUNCTION
  localField: 'senderId',
  foreignField: '_id',
  justOne: true,
});

// Indexes
ChatMessageSchema.index({ chatRoomId: 1, createdAt: -1 });
ChatMessageSchema.index({ chatRoomId: 1, isRead: 1 });

export const ChatMessageModel = mongoose.model<ChatMessage>('ChatMessage', ChatMessageSchema);