// src/infrastructure/services/StripePaymentService.ts
import Stripe from 'stripe';
import { injectable } from 'tsyringe';
import { PaymentService } from '../../application/service/PaymentService';

@injectable()
export class StripePaymentService implements PaymentService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      // apiVersion: '2023-10-16',
    });
  }

  async createPaymentIntent(
    amount: number,
    currency: string = 'inr',
    metadata: any = {}
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to paise for INR
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      if (!paymentIntent.client_secret) {
        throw new Error('Failed to create payment intent');
      }

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error: any) {
      console.error('Stripe payment intent creation failed:', error);
      throw new Error(`Payment intent creation failed: ${error.message}`);
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<boolean> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent.status === 'succeeded';
    } catch (error: any) {
      console.error('Payment confirmation failed:', error);
      return false;
    }
  }

  async refundPayment(paymentIntentId: string, amount?: number): Promise<boolean> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
      });
      return refund.status === 'succeeded';
    } catch (error: any) {
      console.error('Refund failed:', error);
      return false;
    }
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<any> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error: any) {
      console.error('Retrieve payment intent failed:', error);
      throw new Error(`Failed to retrieve payment intent: ${error.message}`);
    }
  }

  async constructWebhookEvent(body: any, signature: string): Promise<Stripe.Event> {
    try {
      return this.stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (error: any) {
      console.error('Webhook signature verification failed:', error);
      throw new Error(`Webhook signature verification failed: ${error.message}`);
    }
  }
}