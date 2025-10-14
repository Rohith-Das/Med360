// server/src/presentation/controllers/videoCall/VideoCallController.ts
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

      console.log(`🔵 Initiate call request - User: ${userId}, Role: ${userRole}, Appointment: ${appointmentId}`);

      if (!userId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized - Missing user credentials'
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

      console.log(`✅ Video call initiated successfully - Room: ${session.roomId}`);

      return res.status(200).json({
        success: true,
        message: 'Video call initiated successfully',
        data: {
          roomId: session.roomId,
          appointmentId: session.appointmentId,
          status: session.status,
          doctorId: session.doctorId,
          patientId: session.patientId,
          initiatedBy: session.initiatedBy
        }
      });
    } catch (error: any) {
      console.error('❌ Initiate call error:', error);
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
      const userRole = req.user?.role;

      console.log(`🔵 Join call request - User: ${userId}, Role: ${userRole}, Room: ${roomId}`);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized - Missing user ID'
        });
      }

      if (!roomId) {
        return res.status(400).json({
          success: false,
          message: 'Room ID is required'
        });
      }

      // Validate roomId format
      if (!roomId.startsWith('room_')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid room ID format'
        });
      }

      const videoCallUC = container.resolve(VideoCallUseCase);
      const session = await videoCallUC.joinCall(roomId, userId);

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Video call session not found or expired'
        });
      }

      console.log(`✅ User ${userId} joined call successfully - Room: ${roomId}, Status: ${session.status}`);

      return res.status(200).json({
        success: true,
        message: 'Joined video call successfully',
        data: {
          roomId: session.roomId,
          appointmentId: session.appointmentId,
          status: session.status,
          doctorId: session.doctorId,
          patientId: session.patientId,
          doctorName: session.doctorName,
          patientName: session.patientName,
          participants: [
            { id: session.doctorId, name: session.doctorName, role: 'doctor' },
            { id: session.patientId, name: session.patientName, role: 'patient' }
          ]
        }
      });
    } catch (error: any) {
      console.error('❌ Join call error:', error);
      
      // Return specific error messages
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Video call session not found or has expired'
        });
      }
      
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to join this video call'
        });
      }

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

      console.log(`🔵 End call request - User: ${userId}, Room: ${roomId}`);

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

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Video call session not found'
        });
      }

      console.log(`✅ Call ended successfully by ${userId} - Room: ${roomId}`);

      return res.status(200).json({
        success: true,
        message: 'Video call ended successfully',
        data: { ended: result }
      });
    } catch (error: any) {
      console.error('❌ End call error:', error);
      
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to end this video call'
        });
      }

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

      console.log(`🔵 Get call status - User: ${userId}, Room: ${roomId}`);

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
      const session = await videoCallUC.getActiveSession(roomId);

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

      console.log(`✅ Call status retrieved - Room: ${roomId}, Status: ${session.status}`);

      return res.status(200).json({
        success: true,
        message: 'Call status retrieved successfully',
        data: {
          roomId: session.roomId,
          appointmentId: session.appointmentId,
          status: session.status,
          doctorId: session.doctorId,
          patientId: session.patientId,
          doctorName: session.doctorName,
          patientName: session.patientName,
          startedAt: session.startedAt,
          endedAt: session.endedAt
        }
      });

    } catch (error: any) {
      console.error('❌ Get call status error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get call status'
      });
    }
  }
}