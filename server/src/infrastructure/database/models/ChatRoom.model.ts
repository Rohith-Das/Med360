
// src/infrastructure/database/models/ChatRoom.model.ts
import mongoose, { Schema } from 'mongoose';
import { ChatRoom } from '../../../domain/entities/ChatMessage.enity';

const ChatRoomSchema = new Schema<ChatRoom>(
  {
    appointmentId: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, required: true, index: true },
    doctorId: { type: String, required: true, index: true },
    lastMessage: { type: String },
    lastMessageAt: { type: Date },
    unreadCountPatient: { type: Number, default: 0 },
    unreadCountDoctor: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { 
    timestamps: true,
   
  }
);

export const ChatRoomModel = mongoose.model<ChatRoom>('ChatRoom', ChatRoomSchema);