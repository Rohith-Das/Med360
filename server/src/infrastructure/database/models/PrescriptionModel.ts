// server/src/infrastructure/database/models/PrescriptionModel.ts
import mongoose, { Schema } from 'mongoose';
import { Medicine, Prescription } from '../../../domain/entities/Prescription.entity';

const MedicineSchema = new Schema({
  name: { type: String, required: true },
  dosage: {
    morning: { type: Boolean, default: false },
    afternoon: { type: Boolean, default: false },
    night: { type: Boolean, default: false }
  },
  duration: { type: Number, required: true, min: 1 },
  frequency: {
    type: String,
    enum: ['once', 'twice', 'thrice', 'as-needed'],
    required: true
  },
  instructions: { type: String }
}, { _id: false });

const PrescriptionSchema = new Schema<Prescription>(
  {
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    diagnosis: { type: String, required: true },
    medicines: { type: [MedicineSchema],
       required: true,
       validate: [(arr:Medicine[]) => arr.length > 0, 'At least one medicine required'] },
    tests: { type: String },
    notes: { type: String },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);



export const PrescriptionModel = mongoose.model<Prescription>('Prescription', PrescriptionSchema);