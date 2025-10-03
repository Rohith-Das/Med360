import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { AuthRequest } from '../../middlewares/AuthRequest';
import { GetMessagesUC } from '../../../application/Chats/GetMessagesUC';
import { GetChatRoomsUC } from '../../../application/Chats/GetChatRoomsUC';
import { MarkMessagesReadUC } from '../../../application/Chats/MarkMessagesReadUC';

export class ChatController {
  async getChatRooms(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.userId;
      const userType = req.user?.role as 'doctor' | 'patient';

      if (!userId || !userType) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const getChatRoomsUC = container.resolve(GetChatRoomsUC);
      const chatRooms = await getChatRoomsUC.execute(userId, userType);

      return res.status(200).json({
        success: true,
        message: 'Chat rooms fetched successfully',
        data: chatRooms,
      });
    } catch (error: any) {
      console.error('Get chat rooms error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch chat rooms',
      });
    }
  }

  async getMessages(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { chatRoomId } = req.params;
      const { limit = 50, skip = 0 } = req.query;
      const userId = req.user?.userId;
      const userType = req.user?.role as 'doctor' | 'patient';

      if (!userId || !userType) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const getMessagesUC = container.resolve(GetMessagesUC);
      const result = await getMessagesUC.execute({
        chatRoomId,
        userId,
        userType,
        limit: Number(limit),
        skip: Number(skip),
      });

      return res.status(200).json({
        success: true,
        message: 'Messages fetched successfully',
        data: result,
      });
    } catch (error: any) {
      console.error('Get messages error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to fetch messages',
      });
    }
  }

  async markMessagesAsRead(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { chatRoomId } = req.params;
      const userId = req.user?.userId;
      const userType = req.user?.role as 'doctor' | 'patient';

      if (!userId || !userType) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const markReadUC = container.resolve(MarkMessagesReadUC);
      const markedCount = await markReadUC.execute(chatRoomId, userId, userType);

      return res.status(200).json({
        success: true,
        message: 'Messages marked as read',
        data: { markedCount },
      });
    } catch (error: any) {
      console.error('Mark messages read error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to mark messages as read',
      });
    }
  }

  async getUnreadCount(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { chatRoomId } = req.params;
      const userId = req.user?.userId;
      const userType = req.user?.role as 'doctor' | 'patient';

      if (!userId || !userType) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      // This would require adding a method to get unread count for specific room
      // For now, return the count from getChatRooms or implement separately
      
      return res.status(200).json({
        success: true,
        message: 'Unread count fetched successfully',
        data: { unreadCount: 0 }, // Placeholder
      });
    } catch (error: any) {
      console.error('Get unread count error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to get unread count',
      });
    }
  }
}