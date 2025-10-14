import mongoose, { Schema, Document } from "mongoose";

export interface IVideoCallSession extends Document {
  roomId: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  status: "waiting" | "active" | "ended";
  startedAt?: Date;
  endedAt?: Date;
  initiatedBy: "doctor" | "patient";
  doctorName?: string;
  patientName?: string;
}

const VideoCallSessionSchema = new Schema<IVideoCallSession>({
  roomId: { type: String, required: true, unique: true },
  appointmentId: { type: String, required: true },
  doctorId: { type: String, required: true },
  patientId: { type: String, required: true },
  status: {
    type: String,
    enum: ["waiting", "active", "ended"],
    default: "waiting",
  },
  startedAt: Date,
  endedAt: Date,
  initiatedBy: { type: String, enum: ["doctor", "patient"], required: true },
  doctorName: String,
  patientName: String,
});

export const VideoCallSessionModel = mongoose.model<IVideoCallSession>(
  "VideoCallSession",
  VideoCallSessionSchema
);
