// src/infrastructure/database/models/ScheduleModel.ts
import mongoose, { Schema, model } from 'mongoose';
import { Schedule, TimeSlot } from '../../../domain/entities/Schedule.entity';

const TimeSlotSchema = new Schema<TimeSlot>(
  {
    startTime: { type: String, required: true }, // "HH:MM" format
    endTime: { type: String, required: true },   // "HH:MM" format
    isBooked: { type: Boolean, default: false },
    isActive: {  type: Boolean, default: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', default: null },
  },
  { timestamps: true }
);

const ScheduleSchema = new Schema<Schedule>(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    date: { type: Date, required: true },
    timeSlots: [TimeSlotSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Create compound index for efficient queries
ScheduleSchema.index({ doctorId: 1, date: 1 }, { unique: true });
ScheduleSchema.index({ doctorId: 1, isActive: 1 });

export const ScheduleModel = mongoose.model<Schedule>('Schedule', ScheduleSchema);