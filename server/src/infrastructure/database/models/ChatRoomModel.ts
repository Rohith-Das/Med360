import mongoose,{Schema} from "mongoose";

import { ChatRoom } from "../../../domain/entities/ChatRoom.entity";

const ChatRoomSchema = new Schema<ChatRoom>(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    lastAppointmentDate: { type: Date, required: true },
  },
  { timestamps: true }
);

ChatRoomSchema.index({ doctorId: 1, patientId: 1 }, { unique: true });

// Index for expiry management
ChatRoomSchema.index({ expiresAt: 1 });
ChatRoomSchema.index({ isActive: 1, expiresAt: 1 });

export const ChatRoomModel = mongoose.model<ChatRoom>('ChatRoom', ChatRoomSchema);