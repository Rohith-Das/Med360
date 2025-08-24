import { Types } from 'mongoose';

// src/domain/entities/AppointmentEntity.ts
export interface Appointment {
  id: string;
  patientId: string |Types.ObjectId ;
  doctorId: string |Types.ObjectId ;
  scheduleId: string |Types.ObjectId ;
  timeSlotId: string |Types.ObjectId ;
  date: Date;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  consultationFee: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}