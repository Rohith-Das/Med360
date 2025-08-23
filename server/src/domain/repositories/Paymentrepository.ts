import { Payment } from "../entities/PaymentEntity";
// src/domain/repositories/PaymentRepository.ts
export interface IPaymentRepository {
  create(payment: Omit<Payment, 'id'>): Promise<Payment>;
  findById(id: string): Promise<Payment | null>;
  findByPaymentIntentId(paymentIntentId: string): Promise<Payment | null>;
  findByAppointmentId(appointmentId: string): Promise<Payment | null>;
  update(id: string, updates: Partial<Payment>): Promise<Payment | null>;
  findByPatientId(patientId: string): Promise<Payment[]>;
}