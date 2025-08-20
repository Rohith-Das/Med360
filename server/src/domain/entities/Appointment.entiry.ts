import { Types } from 'mongoose';

export interface Appointment {
  id?: string;
  patientId: string;
  doctorId: string;
  scheduleId: string;
  timeSlotId: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  consultationFee: number;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentId?: string;
  stripePaymentIntentId?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}