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
  ...saved.toObject(),
  id: saved._id.toString(),
};

  }

  async findById(id: string): Promise<Payment | null> {
    const payment = await PaymentModel.findById(id);
    if (!payment) return null;
    return {
       ...payment.toObject(),
      id: payment._id.toString(),
     
    };
  }

  async findByPaymentIntentId(paymentIntentId: string): Promise<Payment | null> {
    const payment = await PaymentModel.findOne({ stripePaymentIntentId: paymentIntentId });
    if (!payment) return null;
    return {
        ...payment.toObject(),
      id: payment._id.toString(),
    
    };
  }

  async findByAppointmentId(appointmentId: string): Promise<Payment | null> {
    const payment = await PaymentModel.findOne({ appointmentId });
    if (!payment) return null;
    return {
        ...payment.toObject(),
      id: payment._id.toString(),
    
    };
  }

  async update(id: string, updates: Partial<Payment>): Promise<Payment | null> {
    const updated = await PaymentModel.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) return null;
    return {
          ...updated.toObject(),
      id: updated._id.toString(),
  
    };
  }

  async findByPatientId(patientId: string): Promise<Payment[]> {
    const payments = await PaymentModel.find({ patientId }).sort({ createdAt: -1 });
    return payments.map(payment => ({
       ...payment.toObject(),
      id: payment._id.toString(),
     
    }));
  }
}