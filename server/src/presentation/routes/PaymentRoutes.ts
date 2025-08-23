// src/presentation/routes/PaymentRoutes.ts
import express from 'express';
import { authGuard } from '../middlewares/AuthMiddleware';
import { PaymentController } from '../controllers/payment/PaymentController';


const PaymentRouter = express.Router();
const paymentController = new PaymentController();

// Create payment intent
PaymentRouter.post('/create-payment-intent', authGuard, paymentController.createPaymentIntent);

// Confirm payment
PaymentRouter.post('/confirm', paymentController.confirmPayment);

// Webhook endpoint (no auth required)
PaymentRouter.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

// Get payment status
PaymentRouter.get('/status/:appointmentId', authGuard, paymentController.getPaymentStatus);

export default PaymentRouter;