// src/application/Appointment/CancelAppointmentUC.ts
import { inject, injectable } from 'tsyringe';
import { IAppointmentRepository } from '../../domain/repositories/AppointmentRepository';
import { IPaymentRepository } from '../../domain/repositories/Paymentrepository';
import { IWalletRepository } from '../../domain/repositories/WalletRepository';

@injectable()
export class CancelAppointmentUC {
  constructor(
    @inject('IAppointmentRepository')
    private appointmentRepository: IAppointmentRepository,

    @inject('IPaymentRepository')
    private paymentRepository: IPaymentRepository,

    @inject('IWalletRepository')
    private walletRepository: IWalletRepository
  ) {}

  async execute(
    appointmentId: string,
    patientId: string,
    reason?: string
  ): Promise<{ success: boolean; refunded: boolean; refundAmount?: number; message: string }> {
    try {
      // 1. Find the appointment
      const appointment = await this.appointmentRepository.findById(appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // 2. Check if the appointment belongs to the patient
      if (appointment.patientId.toString() !== patientId) {
        throw new Error('Unauthorized: Appointment does not belong to you');
      }

      // 3. Check if appointment can be cancelled
      if (appointment.status === 'cancelled') {
        throw new Error('Appointment is already cancelled');
      }

      if (appointment.status === 'completed') {
        throw new Error('Cannot cancel completed appointment');
      }

      // 4. Check cancellation timing
      const appointmentDateTime = new Date(`${appointment.date} ${appointment.startTime}`);
      const now = new Date();
      const timeDifference = appointmentDateTime.getTime() - now.getTime();
      const twoHoursInMs = 2 * 60 * 60 * 1000;


      // 5. Update appointment status to cancelled
      const updatedAppointment = await this.appointmentRepository.update(appointmentId, {
        status: 'cancelled',
        notes: reason || 'Cancelled by patient'
      });

      if (!updatedAppointment) {
        throw new Error('Failed to cancel appointment');
      }

      let refunded = false;
      let refundAmount = 0;
      let refundMessage = '';

      // 6. Handle refund if appointment was paid
      if (appointment.paymentStatus === 'paid') {
        const payment = await this.paymentRepository.findByAppointmentId(appointmentId);

        if (payment) {
          refundAmount = payment.amount;
          
          // Update payment status
          await this.paymentRepository.update(payment.id, {
            status: 'refunded',
            refundAmount: payment.amount,
            refundReason: 'Appointment cancelled by patient'
          });

          // Add refund to wallet
          const wallet = await this.walletRepository.findByPatientId(patientId);
          if (wallet) {
            // ✅ Add credit transaction to wallet
            await this.walletRepository.updateBalance(wallet.id, payment.amount, 'credit');
            
            // ✅ Add transaction record
            await this.walletRepository.addTransaction({
              walletId: wallet.id,
              patientId,
              type: 'credit',
              amount: payment.amount,
              description: `Refund for cancelled appointment #${appointmentId.slice(-8)}`,
              referenceId: appointmentId,
              referenceType: 'appointment_refund',
              status: 'completed'
            });

            console.log(`Refund processed: ₹${payment.amount} credited to wallet for patient ${patientId}`);
          } else {
            console.error('Wallet not found for patient:', patientId);
            throw new Error('Wallet not found. Please contact support.');
          }

          // Update appointment payment status
          await this.appointmentRepository.update(appointmentId, {
            paymentStatus: 'refunded'
          });

          refunded = true;
          refundMessage = ` Refund of ₹${payment.amount} has been credited to your wallet.`;
        }
      }
console.log('refunded amount',refundAmount)
      // 7. Return success with refund amount
      return {
        success: true,
        refunded,
        refundAmount, // ✅ Include refund amount in response
        message: `Appointment cancelled successfully.${refundMessage}`
      };

    } catch (error: any) {
      console.error('Cancel appointment error:', error);
      throw new Error(error.message || 'Failed to cancel appointment');
    }
  }
}