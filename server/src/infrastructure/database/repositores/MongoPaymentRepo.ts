// src/infrastructure/database/repositories/MongoPaymentRepo.ts
import { injectable } from 'tsyringe';
import { IPaymentRepository } from '../../../domain/repositories/Paymentrepository';
import { Payment } from '../../../domain/entities/PaymentEntity';
import { PaymentModel } from '../models/PaymentModel';

@injectable()
export class MongoPaymentRepository implements IPaymentRepository {
  async create(payment: Omit<Payment, 'id'>): Promise<Payment> {
    const newPayment = new PaymentModel(payment);
    const saved = await newPayment.save();
    return {
      id: saved._id.toString(),
      ...saved.toObject(),
    };
  }

  async findById(id: string): Promise<Payment | null> {
    const payment = await PaymentModel.findById(id);
    if (!payment) return null;
    return {
      id: payment._id.toString(),
      ...payment.toObject(),
    };
  }

  async findByPaymentIntentId(paymentIntentId: string): Promise<Payment | null> {
    const payment = await PaymentModel.findOne({ stripePaymentIntentId: paymentIntentId });
    if (!payment) return null;
    return {
      id: payment._id.toString(),
      ...payment.toObject(),
    };
  }

  async findByAppointmentId(appointmentId: string): Promise<Payment | null> {
    const payment = await PaymentModel.findOne({ appointmentId });
    if (!payment) return null;
    return {
      id: payment._id.toString(),
      ...payment.toObject(),
    };
  }

  async update(id: string, updates: Partial<Payment>): Promise<Payment | null> {
    const updated = await PaymentModel.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) return null;
    return {
      id: updated._id.toString(),
      ...updated.toObject(),
    };
  }

  async findByPatientId(patientId: string): Promise<Payment[]> {
    const payments = await PaymentModel.find({ patientId }).sort({ createdAt: -1 });
    return payments.map(payment => ({
      id: payment._id.toString(),
      ...payment.toObject(),
    }));
  }
}