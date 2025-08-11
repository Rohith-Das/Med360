
import mongoose, { Schema, model, Types } from "mongoose";
import { Doctor } from "../../../domain/entities/Doctor.entity";
import { Doc } from "zod/v4/core/doc.cjs";

const DoctorSchema = new Schema<Doctor>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        phone: { type: String, required: true },
        registerNo: { type: String, required: true },
        specialization: { type: Schema.Types.ObjectId, ref: 'Specialization', required: true },
        experience: { type: Number, required: true },
        languages: { type: [String], required: true },
        licensedState: { type: String, required: true },
 idProof: { type: String, required: true },
        resume: { type: String, required: true },
        profileImage: { type: String },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        isBlocked: { type: Boolean, default: false },
        gender: { type: String, enum: ['male', 'female', 'other'] },
        dateOfBirth: { type: Date },
        education: { type: String },
        consultationFee: { type: Number },
    },
    { timestamps: true }
);


export const DoctorModel=mongoose.model<Doctor>("Doctor",DoctorSchema)