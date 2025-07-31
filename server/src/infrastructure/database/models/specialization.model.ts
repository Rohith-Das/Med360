import mongoose, { Schema, Document } from "mongoose";
import { Specialization } from "../../../domain/entities/specialization.entity";

interface SpecializationDocument extends Omit<Specialization,'id'>,Document{
    _id:string;
}
const SpecializationSchema:Schema=new Schema(
    {
        name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true }
    },
  { timestamps: true }
)

export const SpecializationModel = mongoose.model<SpecializationDocument>("Specialization", SpecializationSchema);