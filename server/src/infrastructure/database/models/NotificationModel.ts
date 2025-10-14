import mongoose, { Schema } from 'mongoose';
import { Notification } from '../../../domain/entities/Notification.entity';
const NotificationSchema = new Schema<Notification>(
  {
    recipientId: { type: String, required: true, index: true },
    recipientType: { 
      type: String, 
      enum: ['doctor', 'patient', 'admin'], 
      required: true 
    },
    
    senderId: { type: String },
    senderType: { 
      type: String, 
      enum: ['patient', 'doctor', 'admin'] 
    },
    type: {
      type: String,
      enum: [
        'appointment_booked',
        'appointment_cancelled', 
        'appointment_confirmed',
        'appointment_rescheduled',
        'payment_received',
        'payment_refunded',
        'system_announcement',
        'video_call_initiated',
        'video_call_ended',
        'video_call_initiated',
      ],
      required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: {
      appointmentId: String,
      patientId: String,
      doctorId: String,
      paymentId: String,
      amount: Number,
      appointmentDate: String,
      appointmentTime: String,
      doctorName: String,
      patientName: String,
      specialization: String,
      consultationFee: Number,
      refundAmount: Number,
      roomId: String
    },
    isRead: { type: Boolean, default: false, index: true },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    expiresAt: { 
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  },
  { 
    timestamps: true,
  }
);

export const NotificationModel = mongoose.model<Notification>('Notification', NotificationSchema);
