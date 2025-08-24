// src/application/payment/WalletPaymentUC.ts
import { inject, injectable } from 'tsyringe';
import { IWalletRepository } from '../../domain/repositories/WalletRepository';
import { IPaymentRepository } from '../../domain/repositories/Paymentrepository';
import { IAppointmentRepository } from '../../domain/repositories/AppointmentRepository';
import { CreateAppointmentUC } from '../Appointment/CreateAppointmentUC';

interface WalletPaymentRequest {
  patientId: string;
  doctorId: string;
  scheduleId: string;
  timeSlotId: string;
  date: Date;
  startTime: string;
  endTime: string;
  consultationFee: number;
}

@injectable()
export class WalletPaymentUC {
  constructor(
    private walletRepository: IWalletRepository,
    @inject('IPaymentRepository')
    private paymentRepository: IPaymentRepository,
    @inject('IAppointmentRepository')
    private appointmentRepository: IAppointmentRepository,
    private createAppointmentUC: CreateAppointmentUC
  ) {}

  async execute(request: WalletPaymentRequest): Promise<{ appointment: any; payment: any; message: string }> {
    try {
      const { patientId, consultationFee } = request;

      // Check if wallet exists
      let wallet = await this.walletRepository.findByPatientId(patientId);
      
      if (!wallet) {
        // Create wallet if it doesn't exist
        wallet = await this.walletRepository.createWallet({
          patientId,
          balance: 0,
          currency: 'inr',
          isActive: true
        });
      }

      // Check if wallet has sufficient balance
      if (wallet.balance < consultationFee) {
        throw new Error(`Insufficient wallet balance. Available: ₹${wallet.balance}, Required: ₹${consultationFee}`);
      }

      // Create appointment first
      const appointment = await this.createAppointmentUC.execute({
        patientId,
        doctorId: request.doctorId,
        scheduleId: request.scheduleId,
        timeSlotId: request.timeSlotId,
        date: request.date,
        startTime: request.startTime,
        endTime: request.endTime,
        consultationFee
      });

      // Deduct amount from wallet
      const updatedWallet = await this.walletRepository.updateBalance(
        wallet.id, 
        consultationFee, 
        'debit'
      );

      if (!updatedWallet) {
        throw new Error('Failed to deduct amount from wallet');
      }

      // Create wallet transaction record
      await this.walletRepository.addTransaction({
        walletId: wallet.id,
        patientId,
        type: 'debit',
        amount: consultationFee,
        description: `Payment for appointment with Dr. ${request.doctorId}`,
        referenceId: appointment.id,
        referenceType: 'appointment_payment',
        status: 'completed'
      });

      // Create payment record
      const payment = await this.paymentRepository.create({
        appointmentId: appointment.id,
        patientId,
        doctorId: request.doctorId,
        amount: consultationFee,
        currency: 'inr',
        status: 'completed',
        stripePaymentIntentId: `wallet_${Date.now()}_${appointment.id}`, // Unique identifier for wallet payments
        paymentMethod: 'wallet'
      });

      // Update appointment payment status
      await this.appointmentRepository.update(appointment.id, {
        status: 'confirmed',
        paymentStatus: 'paid'
      });

      return {
        appointment,
        payment,
        message: 'Payment successful using wallet. Your appointment has been booked!'
      };

    } catch (error: any) {
      throw new Error(error.message || 'Wallet payment failed');
    }
  }
}