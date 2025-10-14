import mongoose,{Schema} from "mongoose";

import { ChatRoom } from "../../../domain/entities/ChatRoom.entity";

const ChatRoomSchema = new Schema<ChatRoom>(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    lastAppointmentDate: { type: Date, required: true },
  },
  { timestamps: true }
);

ChatRoomSchema.index({ doctorId: 1, patientId: 1 }, { unique: true });


export const ChatRoomModel = mongoose.model<ChatRoom>('ChatRoom', ChatRoomSchema);