// src/application/payment/ConfirmPaymentUC.ts
import { inject, injectable } from 'tsyringe';
import { IPaymentRepository } from '../../domain/repositories/Paymentrepository';
import { IAppointmentRepository } from '../../domain/repositories/AppointmentRepository';
import { PaymentService } from '../service/PaymentService';
import { IScheduleRepository } from '../../domain/repositories/ScheduleRepository-method';

@injectable()
export class ConfirmPaymentUC {
  constructor(
    @inject('IPaymentRepository') private paymentRepo: IPaymentRepository,
    @inject('IAppointmentRepository') private appointmentRepo: IAppointmentRepository,
    @inject('PaymentService') private paymentService: PaymentService,
    @inject('IScheduleRepository') private scheduleRepo: IScheduleRepository
  ) {}

  async execute(paymentIntentId: string): Promise<boolean> {
    try {
      // Find payment by payment intent ID
      const payment = await this.paymentRepo.findByPaymentIntentId(paymentIntentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      // Confirm payment with Stripe
      const isConfirmed = await this.paymentService.confirmPayment(paymentIntentId);
      if (!isConfirmed) {
        await this.paymentRepo.update(payment.id, { status: 'failed' });
        throw new Error('Payment confirmation failed');
      }

      // Update payment status
      await this.paymentRepo.update(payment.id, { status: 'completed' });

      // Update appointment status
      await this.appointmentRepo.update(payment.appointmentId, {
        status: 'confirmed',
        paymentStatus: 'paid',
      });

      // Get appointment to mark time slot as booked
      const appointment = await this.appointmentRepo.findById(payment.appointmentId);
      if (appointment) {
        await this.scheduleRepo.updateTimeSlot(
          appointment.scheduleId,
          appointment.timeSlotId,
          {
            isBooked: true,
            patientId: appointment.patientId,
          }
        );
      }

      return true;
    } catch (error: any) {
      console.error('Confirm payment error:', error);
      throw new Error(`Payment confirmation failed: ${error.message}`);
    }
  }
}