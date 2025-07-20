import mongoose,{Schema,Document} from "mongoose";
import { Patient } from "../../../domain/entities/patient.entity";
import { optional } from "zod";

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
    isDeleted: { type: Boolean, default: false }, 
     isBlocked: { type: Boolean, default: false },
     role: { type: String, enum: ['patient', 'doctor', 'admin'],
     default: 'patient' },
     refreshToken: { type: String },
    refreshTokenExpiresAt: { type: Date },
    profilePicture: { type: String, optional: true, trim: true },
     gender: { type: String, enum: ["male", "female"], optional:true },
     dateOfBirth: { type: Date, optional: true },
    },
      { timestamps: true }
);


export const PatientModel=mongoose.model<PatientDocument>("Patient",PatientSchema)






