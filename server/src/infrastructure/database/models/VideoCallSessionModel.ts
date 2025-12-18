import mongoose, { Schema, Document } from "mongoose";
import { VideoCallSession } from "../../../domain/entities/VideoCallSession.entity";

const VideoCallSessionSchema = new Schema<VideoCallSession>(
  {
    roomId: { type: String, required: true, unique: true },
    appointmentId: { type: String, required: true },
    doctorId: { type: String, required: true },
    patientId: { type: String, required: true },

    status: {
      type: String,
      enum: ["waiting", "active", "ended"],
      default: "waiting",
    },

    initiatedBy: {
      type: String,
      enum: ["doctor", "patient"],
      required: true,
    },

    doctorName: String,
    patientName: String,

    startedAt: Date,
    endedAt: Date,
    durationSeconds: Number,
  },
  { timestamps: true }
);

/**
 * Calculate duration when call ends
 */
VideoCallSessionSchema.pre("save", function (next) {
  if (this.isModified("status") && this.status === "ended") {
    this.endedAt = this.endedAt || new Date();

    if (this.startedAt) {
      this.durationSeconds = Math.floor(
        (this.endedAt.getTime() - this.startedAt.getTime()) / 1000
      );
    }
  }
  next();
});

export const VideoCallSessionModel =
  mongoose.model<VideoCallSession>(
    "VideoCallSession",
    VideoCallSessionSchema
  );
