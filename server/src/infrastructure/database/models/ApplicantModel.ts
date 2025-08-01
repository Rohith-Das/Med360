import { Schema, model, Types } from "mongoose";
import { Applicant } from "../../../domain/entities/Applicant.entity";

const applicantSchema = new Schema<Applicant>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    registerNo: { type: String, required: true },
    experience: { type: Number, required: true },
    languages: { type: [String], default: [] },
    specialization: {
      type: Types.ObjectId,
      ref: "Specialization",
      required: true,
    },
    licensedState: { type: String, required: true },
    idProof: { type: String, required: true },
    resume: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

export const ApplicantModel = model<Applicant>("Applicant", applicantSchema);
