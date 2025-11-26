import { Types } from "mongoose";

export interface Medicine {
  name: string;
  dosage: {
    morning: boolean;
    afternoon: boolean;
    night: boolean;
  };
  duration: number;
  frequency: 'once' | 'twice' | 'thrice' | 'as-needed';
  instructions?: string;
}

export interface Prescription {
  id?: string;
  appointmentId: string | Types.ObjectId;
  doctorId: string | Types.ObjectId;
  patientId: string | Types.ObjectId;
  diagnosis: string;
  medicines: Medicine[];
  tests?: string;
  notes?: string;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}