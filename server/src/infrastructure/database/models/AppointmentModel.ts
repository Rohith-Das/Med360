// src/infrastructure/database/models/AppointmentModel.ts
import mongoose, { Schema } from 'mongoose';
import { Appointment } from '../../../domain/entities/Appointment.entiry';
const AppointmentSchema = new Schema<Appointment>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    scheduleId: { type: Schema.Types.ObjectId, ref: 'Schedule', required: true },
    timeSlotId: { type: String, required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    consultationFee: { type: Number, required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

export const AppointmentModel = mongoose.model<Appointment>('Appointment', AppointmentSchema);