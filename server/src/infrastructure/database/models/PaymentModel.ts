import mongoose, { Schema, model } from 'mongoose';
import { Payment } from '../../../domain/entities/PaymentEntity';
import { Types } from 'mongoose';
const PaymentSchema = new Schema<Payment>(
  {
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'inr' },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    stripePaymentIntentId: { type: String, required: true, unique: true },
    stripeClientSecret: { type: String },
     paymentMethod: { 
      type: String, 
      enum: ['stripe', 'wallet'], 
      required: true 
    },
    failureReason: { type: String },
    refundAmount: { type: Number },
    refundReason: { type: String },
  },
  { timestamps: true }
);



export const PaymentModel = mongoose.model<Payment>('Payment', PaymentSchema);