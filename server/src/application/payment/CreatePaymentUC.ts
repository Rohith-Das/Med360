// src/application/payment/CreatePaymentUC.ts
import { inject, injectable } from 'tsyringe';
import { IPaymentRepository } from '../../domain/repositories/Paymentrepository';
import { PaymentService } from '../service/PaymentService';
import { Payment } from '../../domain/entities/PaymentEntity';

interface CreatePaymentInput {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  amount: number;
  paymentMethod: 'stripe' | 'wallet';
}

@injectable()
export class CreatePaymentUC {
  constructor(
    @inject('IPaymentRepository') private paymentRepo: IPaymentRepository,
    @inject('PaymentService') private paymentService: PaymentService
  ) {}

  async execute(input: CreatePaymentInput): Promise<{
    payment: Payment;
    clientSecret: string;
  }> {
    try {
      // Check if payment already exists for this appointment
      const existingPayment = await this.paymentRepo.findByAppointmentId(input.appointmentId);
      if (existingPayment && existingPayment.status !== 'failed') {
        throw new Error('Payment already exists for this appointment');
      }

      // Create Stripe payment intent
      const { clientSecret, paymentIntentId } = await this.paymentService.createPaymentIntent(
        input.amount,
        'inr',
        {
          appointmentId: input.appointmentId,
          patientId: input.patientId,
          doctorId: input.doctorId,
        }
      );

      // Create payment record
      const payment = await this.paymentRepo.create({
        appointmentId: input.appointmentId,
        patientId: input.patientId,
        doctorId: input.doctorId,
        amount: input.amount,
        currency: 'inr',
        status: 'pending',
        stripePaymentIntentId: paymentIntentId,
        stripeClientSecret: clientSecret,
        paymentMethod: input.paymentMethod,
      });

      return { payment, clientSecret };
    } catch (error: any) {
      console.error('Create payment error:', error);
      throw new Error(`Payment creation failed: ${error.message}`);
    }
  }
}