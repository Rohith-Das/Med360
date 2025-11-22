// server/src/domain/entities/ChatRoom.entity.ts
import mongoose from "mongoose";

// User data that can be populated
export interface ChatUser {
  id: string;
  name: string;
  profilePicture?: string;
  specialization?: string; // only for doctors
}

// Main ChatRoom entity with support for both populated and unpopulated states
export interface ChatRoom {
  id?: string;
  
  // These can be either ObjectId/string OR populated user objects
  doctorId: string | mongoose.Types.ObjectId;
  patientId: string | mongoose.Types.ObjectId;
  
  // Populated user data (optional, only when populated)
  doctor?: ChatUser;
  patient?: ChatUser;
  
 lastAppointmentDate?: Date | null;

  lastMessage?: {
    text: string;
    timestamp: Date;
    senderType: 'doctor' | 'patient';
  };
  
  createdAt?: Date;
  updatedAt?: Date;
}