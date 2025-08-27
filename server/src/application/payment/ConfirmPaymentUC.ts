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
      
      if (payment.status === 'completed') {
        console.log('Payment already confirmed:', paymentIntentId);
        return true;
      }

      // Confirm payment with Stripe
      const isConfirmed = await this.paymentService.confirmPayment(paymentIntentId);
      if (!isConfirmed) {
        await this.paymentRepo.update(payment.id, { status: 'failed' });
        throw new Error('Payment confirmation failed with stripe');
      }

      // Update payment status
      await this.paymentRepo.update(payment.id, { status: 'completed' });

      // Update appointment status
      await this.appointmentRepo.update(payment.appointmentId.toString(), {
        status: 'confirmed',
        paymentStatus: 'paid',
      });

        const appointment = await this.appointmentRepo.findById(payment.appointmentId.toString());
      if (appointment) {
        await this.scheduleRepo.updateTimeSlot(
          appointment.scheduleId.toString(),
          appointment.timeSlotId.toString(),
          {
            isBooked: true,
                patientId: appointment.patientId.toString(),
          }
        );
        console.log('Time slot marked as booked for appointment:', appointment.id);
      }

      console.log('Payment confirmed successfully:', paymentIntentId);
      
      return true;
    } catch (error: any) {
      console.error('Confirm payment error:', error);
      throw new Error(`Payment confirmation failed: ${error.message}`);
    }
  }
}