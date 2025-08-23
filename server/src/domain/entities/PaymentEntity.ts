import { Types } from 'mongoose';

// src/domain/entities/PaymentEntity.ts
export interface Payment {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripePaymentIntentId: string;
  stripeClientSecret?: string;
  paymentMethod: 'stripe' | 'wallet';
  failureReason?: string;
  refundAmount?: number;
  refundReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}