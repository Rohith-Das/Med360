import { Types } from 'mongoose';

// src/domain/entities/AppointmentEntity.ts
export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  scheduleId: string;
  timeSlotId: string;
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