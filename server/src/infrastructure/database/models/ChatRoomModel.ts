// server/src/infrastructure/persistence/models/ChatRoomModel.ts
import mongoose, { Schema, Document } from "mongoose";

// Interface for the Mongoose document
interface IChatRoomDocument extends Document {
  doctorId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  lastAppointmentDate: Date;
  lastMessage?: {
    text: string;
    timestamp: Date;
    senderType: 'doctor' | 'patient';
  };
  createdAt: Date;
  updatedAt: Date;
}

const ChatRoomSchema = new Schema<IChatRoomDocument>(
  {
    doctorId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Doctor', 
      required: true 
    },
    patientId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Patient', 
      required: true 
    },
    lastAppointmentDate: { 
      type: Date, 
      required: false
    },
    lastMessage: {
      text: { type: String },
      timestamp: { type: Date },
      senderType: { 
        type: String, 
        enum: ['doctor', 'patient'] 
      },
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
// ChatRoomSchema.index({ doctorId: 1, patientId: 1 }, { unique: true });
ChatRoomSchema.index({ doctorId: 1 });
ChatRoomSchema.index({ patientId: 1 });
ChatRoomSchema.index({ 'lastMessage.timestamp': -1 });

export const ChatRoomModel = mongoose.model<IChatRoomDocument>('ChatRoom', ChatRoomSchema);