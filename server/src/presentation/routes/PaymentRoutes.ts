// src/presentation/routes/PaymentRoutes.ts
import express from 'express';
import { authGuard } from '../middlewares/AuthMiddleware';
import { PaymentController } from '../controllers/payment/PaymentController';


const PaymentRouter = express.Router();
const paymentController = new PaymentController();

PaymentRouter.post('/create-payment-intent', authGuard, paymentController.createPaymentIntent);
PaymentRouter.post('/confirm', paymentController.confirmPayment);
PaymentRouter.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

// Get payment status
PaymentRouter.get('/status/:appointmentId', authGuard, paymentController.getPaymentStatus);
PaymentRouter.post('/wallet-pay', authGuard, paymentController.ProcessWalletPayment);
export default PaymentRouter;