// server/src/controllers/ChatController/ChatController.ts
import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { AuthRequest } from '../../middlewares/AuthRequest';
import { FindOrCreateChatRoomUC } from '../../../application/Chats/FindOrCreateChatRoomUC';
import { SearchUsersUC } from '../../../application/Chats/SearchUsersUC';

export class ChatController {
  async findOrCreateChatRoom(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { doctorId, patientId } = req.body;
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      if (!userId || !userRole) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      // Validate that the user is either the doctor or patient in the chat
      if (userRole === 'doctor' && doctorId !== userId) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      if (userRole === 'patient' && patientId !== userId) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      const findOrCreateChatRoom = container.resolve(FindOrCreateChatRoomUC);
      const chatRoom = await findOrCreateChatRoom.execute(doctorId, patientId);
      return res.status(200).json({
        success: true,
        message: 'Chat room ready',
        data: chatRoom,
      });
    } catch (error: any) {
      console.error('Find or create chat room error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to create chat room',
      });
    }
  }

  async searchUsers(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { q, type, limit } = req.query; // Changed from req.body to req.query
      const userRole = req.user?.role;
      if (!userRole) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Search query is required',
        });
      }
      let searchType: 'doctors' | 'patients';
      if (type) {
        searchType = type as 'doctors' | 'patients';
      } else {
        searchType = userRole === 'patient' ? 'doctors' : 'patients';
      }
      const searchUserUc = container.resolve(SearchUsersUC);
      const results = await searchUserUc.execute(
        q,
        searchType,
        limit ? parseInt(limit as string) : 20
      );
      return res.status(200).json({
        success: true,
        message: 'Search completed successfully',
        data: results,
      });
    } catch (error: any) {
      console.error('Search users error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to search users',
      });
    }
  }
}