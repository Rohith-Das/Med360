// src/presentation/controllers/PaymentController.ts
import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { CreatePaymentUC } from '../../../application/payment/CreatePaymentUC';
import { ConfirmPaymentUC } from '../../../application/payment/ConfirmPaymentUC';
import { CreateAppointmentUC } from '../../../application/Appointment/CreateAppointmentUC';
import { AuthRequest } from '../../middlewares/AuthRequest';
import { StripePaymentService } from '../../../infrastructure/services/StripePaymentService';
import { WalletPaymentUC } from '../../../application/payment/WalletPaymentUC';

export class PaymentController {
  async createPaymentIntent(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { bookingData } = req.body;
      const patientId = req.user?.userId;

      if (!patientId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      if (!bookingData || !bookingData.doctor || !bookingData.timeSlot) {
        return res.status(400).json({
          success: false,
          message: 'Invalid booking data provided',
        });
      }

      // Create appointment first
      const createAppointmentUC = container.resolve(CreateAppointmentUC);
      const appointment = await createAppointmentUC.execute({
        patientId,
        doctorId: bookingData.doctor.id,
        scheduleId: bookingData.timeSlot.scheduleId,
        timeSlotId: bookingData.timeSlot.id,
        date: new Date(bookingData.timeSlot.date),
        startTime: bookingData.timeSlot.startTime,
        endTime: bookingData.timeSlot.endTime,
        consultationFee: bookingData.doctor.consultationFee,
        paymentMethod: 'stripe',
      });

      // Create payment intent
      const createPaymentUC = container.resolve(CreatePaymentUC);
      const { payment, clientSecret } = await createPaymentUC.execute({
        appointmentId: appointment.id,
        patientId,
        doctorId: bookingData.doctor.id,
        amount: bookingData.doctor.consultationFee,
        paymentMethod: 'stripe',
      });

      return res.status(200).json({
        success: true,
        message: 'Payment intent created successfully',
        data: {
          clientSecret,
          appointmentId: appointment.id,
          paymentId: payment.id,
        },
      });
    } catch (error: any) {
      console.error('Create payment intent error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to create payment intent',
      });
    }
  }

  async confirmPayment(req: Request, res: Response): Promise<Response> {
    try {
      const { paymentIntentId } = req.body;

      if (!paymentIntentId) {
        return res.status(400).json({
          success: false,
          message: 'Payment intent ID is required',
        });
      }

      const confirmPaymentUC = container.resolve(ConfirmPaymentUC);
      const success = await confirmPaymentUC.execute(paymentIntentId);

      if (!success) {
        return res.status(400).json({
          success: false,
          message: 'Payment confirmation failed',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Payment confirmed successfully',
      });
    } catch (error: any) {
      console.error('Confirm payment error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Payment confirmation failed',
      });
    }
  }

  async handleWebhook(req: Request, res: Response): Promise<Response> {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const stripeService = container.resolve(StripePaymentService);

      const event = await stripeService.constructWebhookEvent(req.body, signature);

      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as any;
          const confirmPaymentUC = container.resolve(ConfirmPaymentUC);
          await confirmPaymentUC.execute(paymentIntent.id);
          console.log('Payment succeeded:', paymentIntent.id);
          break;
        case 'payment_intent.payment_failed':
          console.log('Payment failed:', event.data.object);
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      return res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error);
      return res.status(400).json({
        success: false,
        message: `Webhook error: ${error.message}`,
      });
    }
  }

  async getPaymentStatus(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { appointmentId } = req.params;
      const patientId = req.user?.userId;

      if (!patientId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      // You can implement this to check payment status
      // For now, returning a simple response
      return res.status(200).json({
        success: true,
        message: 'Payment status retrieved successfully',
      });
    } catch (error: any) {
      console.error('Get payment status error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve payment status',
      });
    }
  }

  async ProcessWalletPayment(req:AuthRequest,res:Response):Promise<Response>{
    try {
      const {bookingData}=req.body;
      const patientId=req.user?.userId;

      if(!patientId){
       return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      if (!bookingData || !bookingData.doctor || !bookingData.timeSlot) {
        return res.status(400).json({
          success: false,
          message: 'Invalid booking data provided',
        });
      }
      const walletPaymentUC=container.resolve(WalletPaymentUC)
      const result=await walletPaymentUC.execute({
             patientId,
        doctorId: bookingData.doctor.id,
        scheduleId: bookingData.timeSlot.scheduleId,
        timeSlotId: bookingData.timeSlot.id,
        date: new Date(bookingData.timeSlot.date),
        startTime: bookingData.timeSlot.startTime,
        endTime: bookingData.timeSlot.endTime,
        consultationFee: bookingData.doctor.consultationFee,
      })
       return res.status(200).json({
        success: true,
        message: result.message,
        data: {
          appointmentId: result.appointment.id,
          paymentId: result.payment.id,
          appointment: result.appointment
        },
      });
    } catch (error:any) {
       console.error('Wallet payment error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Wallet payment failed',
      });
    }
  }
}