// src/presentation/controllers/videoCall/VideoCallController.ts
import { Request, Response } from "express";
import { container } from "tsyringe";
import { VideoCallUseCase } from "../../../application/videoCall/VideoCallUC";
import { AuthRequest } from "../../middlewares/AuthRequest";

export class VideoCallController {

  async initiateCall(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { appointmentId } = req.body;
      const userId = req.user?.userId!;
      const userRole = req.user?.role as "doctor" | "patient";

      if (!appointmentId) {
        return res.status(400).json({
          success: false,
          message: "Appointment ID is required",
        });
      }
      const videoCallUC = container.resolve(VideoCallUseCase);

      const session = await videoCallUC.initiateCall(
        appointmentId,
        userId,
        userRole
      );

      console.log(`Video call initiated → Room: ${session.roomId} by ${userRole} ${userId}`);

      return res.status(200).json({
        success: true,
        message: "Video call initiated successfully",
        data: {
          roomId: session.roomId,
          appointmentId: session.appointmentId,
          status: session.status,
          initiatedBy: session.initiatedBy,
        },
      });
    } catch (error: any) {
      console.error("Initiate call failed:", error.message);

      // Specific known errors
      if (error.message.includes("not found")) {
        return res.status(404).json({ success: false, message: error.message });
      }
      if (error.message.includes("Unauthorized")) {
        return res.status(403).json({ success: false, message: error.message });
      }
      if (error.message.includes("confirmed")) {
        return res.status(400).json({ success: false, message: error.message });
      }

      return res.status(400).json({
        success: false,
        message: "Failed to initiate video call",
      });
    }
  }

  async joinCall(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { roomId } = req.params;
      const userId = req.user?.userId!;

      if (!roomId?.startsWith("video-room-")) {
        return res.status(400).json({
          success: false,
          message: "Invalid room ID format",
        });
      }
      const videoCallUC = container.resolve(VideoCallUseCase);

      const session = await videoCallUC.joinCall(roomId, userId);

      console.log(`User ${userId} joined room → ${roomId} (${session.status})`);

      return res.status(200).json({
        success: true,
        message: "Joined video call successfully",
        data: {
          roomId: session.roomId,
          appointmentId: session.appointmentId,
          status: session.status,
          doctorId: session.doctorId,
          patientId: session.patientId,
          doctorName: session.doctorName,
          patientName: session.patientName,
          participants: [
            { id: session.doctorId, name: session.doctorName, role: "doctor" },
            { id: session.patientId, name: session.patientName, role: "patient" },
          ],
        },
      });
    } catch (error: any) {
      console.error("Join call failed:", error.message);

      if (error.message.includes("not found") || error.message.includes("expired")) {
        return res.status(404).json({
          success: false,
          message: "Video call session not found or has expired",
        });
      }
      if (error.message.includes("Unauthorized")) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to join this call",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Failed to join video call",
      });
    }
  }

  async endCall(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { roomId } = req.params;
      const userId = req.user?.userId!;
      const videoCallUC = container.resolve(VideoCallUseCase);

      const success = await videoCallUC.endCall(roomId, userId);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: "Video call session not found",
        });
      }

      console.log(`Call ended by ${userId} → Room: ${roomId}`);

      return res.status(200).json({
        success: true,
        message: "Video call ended successfully",
      });
    } catch (error: any) {
      console.error("End call failed:", error.message);

      if (error.message.includes("Unauthorized")) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to end this call",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Failed to end video call",
      });
    }
  }

  async getCallStatus(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { roomId } = req.params;
      const userId = req.user?.userId!;
      const videoCallUC = container.resolve(VideoCallUseCase);

      const session = await videoCallUC.getActiveSession(roomId);

      if (!session) {
        return res.status(404).json({
          success: false,
          message: "Active video call not found",
        });
      }

      // Security: only participants can check status
      if (session.doctorId !== userId && session.patientId !== userId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized to access this call",
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          roomId: session.roomId,
          appointmentId: session.appointmentId,
          status: session.status,
          doctorName: session.doctorName,
          patientName: session.patientName,
          startedAt: session.startedAt,
          endedAt: session.endedAt,
          durationSeconds: session.durationSeconds,
        },
      });
    } catch (error: any) {
      console.error("Get call status error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Optional: New endpoint — very useful for frontend
  async getActiveCallForAppointment(req: AuthRequest, res: Response) {
    try {
      const { appointmentId } = req.params;
      const userId = req.user?.userId!;
      const videoCallUC = container.resolve(VideoCallUseCase);

      const session = await videoCallUC.getSessionByAppointment(appointmentId);

      if (!session) {
        return res.status(404).json({
          success: false,
          message: "No active call for this appointment",
        });
      }

      if (session.doctorId !== userId && session.patientId !== userId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized",
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          roomId: session.roomId,
          status: session.status,
          initiatedBy: session.initiatedBy,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to check active call",
      });
    }
  }
}