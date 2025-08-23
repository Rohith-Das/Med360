// src/application/service/PaymentService.ts
export interface PaymentService {
  createPaymentIntent(amount: number, currency: string, metadata?: any): Promise<{
    clientSecret: string;
    paymentIntentId: string;
  }>;
  confirmPayment(paymentIntentId: string): Promise<boolean>;
  refundPayment(paymentIntentId: string, amount?: number): Promise<boolean>;
  retrievePaymentIntent(paymentIntentId: string): Promise<any>;
}