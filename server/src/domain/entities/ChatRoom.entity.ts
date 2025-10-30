import mongoose from "mongoose";

export interface ChatRoom {
  id?: string;
  doctorId: string | mongoose.Types.ObjectId;
  patientId: string | mongoose.Types.ObjectId;
  lastAppointmentDate: Date;
  lastMessage?:{
    text:string;
    timestamp:Date;
    senderType:'doctor'|'patient'
  }
  createdAt?: Date;
  updatedAt?: Date;
}
