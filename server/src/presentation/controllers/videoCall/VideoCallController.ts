import { Request, Response } from "express";
import { container } from "tsyringe";
import { VideoCallUseCase } from "../../../application/videoCall/VideoCallUC";
import { AuthRequest } from "../../middlewares/AuthRequest";

export class VideoCallController {
  async initiateCall(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { appointmentId } = req.body;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      if (!appointmentId) {
        return res.status(400).json({
          success: false,
          message: 'Appointment ID is required'
        });
      }
      const videoCallUC = container.resolve(VideoCallUseCase);
      const session = await videoCallUC.initiateCall(
        appointmentId,
        userId,
        userRole as 'doctor' | 'patient'
      );
      return res.status(200).json({
        success: true,
        message: 'Video call initiated successfully',
        data: {
          roomId: session.roomId,
          appointmentId: session.appointmentId,
          status: session.status
        }
      });
    } catch (error: any) {
      console.error('Initiate call error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to initiate video call'
      });
    }
  }

  async joinCall(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { roomId } = req.params;
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      if (!roomId) {
        return res.status(400).json({
          success: false,
          message: 'Room ID is required'
        });
      }
      const videoCallUC = container.resolve(VideoCallUseCase);
      const session = await videoCallUC.joinCall(roomId, userId);
      return res.status(200).json({
        success: true,
        message: 'Joined video call successfully',
        data: {
          roomId: session?.roomId,
          status: session?.status
        }
      });
    } catch (error: any) {
      console.error('Join call error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to join video call'
      });
    }
  }

  async endCall(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { roomId } = req.params;
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      if (!roomId) {
        return res.status(400).json({
          success: false,
          message: 'Room ID is required'
        });
      }
      const videoCallUC = container.resolve(VideoCallUseCase);
      const result = await videoCallUC.endCall(roomId, userId);

      return res.status(200).json({
        success: true,
        message: 'Video call ended successfully',
        data: { ended: result }
      });
    } catch (error: any) {
      console.error('End call error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to end video call'
      });
    }
  }

  async getCallStatus(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { roomId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }

      const videoCallUC = container.resolve(VideoCallUseCase);
      const session = videoCallUC.getActiveSession(roomId);

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Video call session not found'
        });
      }

      // Verify user is part of this session
      if (session.doctorId !== userId && session.patientId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to access this video call'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Call status retrieved successfully',
        data: session
      });

    } catch (error: any) {
      console.error('Get call status error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get call status'
      });
    }
  }
}