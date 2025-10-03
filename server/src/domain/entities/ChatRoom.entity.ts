import mongoose,{Schema,Document} from "mongoose";


export interface ChatRoom {
  id: string;
  doctorId: string|mongoose.Types.ObjectId;
  patientId: string|mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  isActive: boolean;
  lastAppointmentDate: Date;
}

export interface CreateChatRoomInput {
  doctorId: string;
  patientId: string;
  lastAppointmentDate: Date;
}