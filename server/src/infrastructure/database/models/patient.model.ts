import mongoose,{Schema,Document} from "mongoose";
import { Patient } from "../../../domain/entities/patient.entity";

interface PatientDocument extends Omit<Patient,"id">,Document{
    _id:string;

}

const PatientSchema:Schema=new Schema(
    {
    name: { type: String, required: true },
    mobile: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    isVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpiresAt: { type: Date },
     role: { type: String, enum: ['patient', 'doctor', 'admin'],
     default: 'patient' },
    },
      { timestamps: true }
);
export const PatientModel=mongoose.model<PatientDocument>("Patient",PatientSchema)






