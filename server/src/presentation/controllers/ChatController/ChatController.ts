// server/src/controllers/ChatController/ChatController.ts
import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { AuthRequest } from '../../middlewares/AuthRequest';
import { FindOrCreateChatRoomUC } from '../../../application/Chats/FindOrCreateChatRoomUC';
import { SearchUsersUC } from '../../../application/Chats/SearchUsersUC';
import { GetUserChatRoomsUC } from '../../../application/Chats/GetUserChatRoomsUC';
import { GetChatRoomMessagesUC } from '../../../application/Chats/GetChatRoomMessagesUC';
import { SendMessageUC } from '../../../application/Chats/SendMessageUC';
import { MarkMessagesAsReadUC } from '../../../application/Chats/MarkMessagesAsReadUC';
import { GetUnreadCountUC } from '../../../application/Chats/GetUnreadCountUC';

export class ChatController {
  async findOrCreateChatRoom(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { doctorId, patientId } = req.body;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      // Enhanced validation
      if (!userId || !userRole) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      if (!doctorId || !patientId) {
        return res.status(400).json({
          success: false,
          message: 'Doctor ID and Patient ID are required'
        });
      }

      // Enhanced authorization - users can only create chats involving themselves
      if (userRole === 'doctor' && doctorId !== userId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Doctors can only create chats from their account' 
        });
      }

      if (userRole === 'patient' && patientId !== userId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Patients can only create chats for themselves' 
        });
      }

      const findOrCreateChatRoomUC = container.resolve(FindOrCreateChatRoomUC);
      const chatRoom = await findOrCreateChatRoomUC.execute(doctorId, patientId);

      console.log(`✅ Chat room ${chatRoom.id} ready for ${userRole} ${userId}`);

      return res.status(200).json({
        success: true,
        message: 'Chat room ready',
        data: chatRoom,
      });
    } catch (error: any) {
      console.error('Find or create chat room error:', error);
      
      // More specific error responses
      if (error.message.includes('No appointment found')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to create chat room',
      });
    }
  }
  async searchUsers(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { q, limit } = req.query;
      const userRole = req.user?.role;
      const userId = req.user?.userId;

      console.log('🔍 Search request:', { 
        query: q, 
        userRole, 
        userId,
        headers: req.headers.authorization?.substring(0, 50)
      });
console.log(userRole,'user is ');

      if (!userRole || !userId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      if (!q || typeof q !== 'string' || q.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid search query is required',
        });
      }

      const cleanQuery = q.trim();
      let searchType: 'doctors' | 'patients';
      
      if (userRole === 'patient') {
        searchType = 'doctors';
        console.log('✅ PATIENT searching for DOCTORS');
      } else if (userRole === 'doctor') {
        searchType = 'patients';
        console.log('✅ DOCTOR searching for PATIENTS');
      } else {
        console.error('❌ Invalid user role:', userRole);
        return res.status(400).json({
          success: false,
          message: 'Invalid user role',
        });
      }

      console.log(`🧠 Final search params: role=${userRole}, searchType=${searchType}, query="${cleanQuery}"`);

      const searchUsersUC = container.resolve(SearchUsersUC);
      const results = await searchUsersUC.execute(
        cleanQuery,
        searchType,
        limit ? parseInt(limit as string) : 20
      );

      console.log(`✅ ${userRole} ${userId} searched for ${searchType}: "${cleanQuery}" - Found ${results.length} results`);

      return res.status(200).json({
        success: true,
        message: 'Search completed successfully',
        data: results,
      });

    } catch (error: any) {
      console.error('❌ Search users error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to search users',
        error: error.message
      });
    }
  }
  async getUserChatRooms(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { limit, offset } = req.query;
      const userId = req.user?.userId;
      const userRole = req.user?.role as 'doctor' | 'patient';

      if (!userId || !userRole) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      const getUserChatRoomsUC = container.resolve(GetUserChatRoomsUC);
      const { chatRooms, unreadCounts } = await getUserChatRoomsUC.execute(
        userId,
        userRole,
        limit ? parseInt(limit as string) : 50,
        offset ? parseInt(offset as string) : 0
      );

      console.log(`✅ Retrieved ${chatRooms.length} chat rooms for ${userRole} ${userId}`);

      return res.status(200).json({
        success: true,
        message: 'Chat rooms retrieved successfully',
        data: {
          chatRooms,
          unreadCounts
        },
      });
    } catch (error: any) {
      console.error('Get user chat rooms error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve chat rooms',
      });
    }
  }

  async getChatRoomMessages(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { roomId } = req.params;
      const { limit, offset } = req.query;
      const userId = req.user?.userId;
      const userRole = req.user?.role as 'doctor' | 'patient';

      if (!userId || !userRole) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      if (!roomId) {
        return res.status(400).json({
          success: false,
          message: 'Room ID is required'
        });
      }

      const getChatRoomMessagesUC = container.resolve(GetChatRoomMessagesUC);
      const messages = await getChatRoomMessagesUC.execute(
        roomId,
        userId,
        userRole,
        limit ? parseInt(limit as string) : 50,
        offset ? parseInt(offset as string) : 0
      );

      console.log(`✅ Retrieved ${messages.length} messages from room ${roomId} for ${userRole} ${userId}`);

      return res.status(200).json({
        success: true,
        message: 'Messages retrieved successfully',
        data: messages,
      });
    } catch (error: any) {
      console.error('Get chat room messages error:', error);
      
      // Specific error handling
      if (error.message.includes('Unauthorized') || error.message.includes('not found')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to chat room'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve messages',
      });
    }
  }

  async sendMessage(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { 
        chatRoomId, 
        message, 
        messageType = 'text',
        fileUrl, 
        fileName, 
        fileSize 
      } = req.body;

      const userId = req.user?.userId;
      const userRole = req.user?.role as 'doctor' | 'patient';

      if (!userId || !userRole) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      if (!chatRoomId || !message?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Chat room ID and message are required'
        });
      }

      const sendMessageUC = container.resolve(SendMessageUC);
      const newMessage = await sendMessageUC.execute({
        chatRoomId,
        senderId: userId,
        senderType: userRole,
        message: message.trim(),
        messageType,
        fileUrl,
        fileName,
        fileSize
      });

      console.log(`✅ Message sent to room ${chatRoomId} by ${userRole} ${userId}`);

      return res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: newMessage,
      });
    } catch (error: any) {
      console.error('Send message error:', error);
      
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to send messages in this chat room'
        });
      }

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: 'Chat room not found'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to send message',
      });
    }
  }

  async markMessagesAsRead(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { roomId } = req.body;
      const userId = req.user?.userId;
      const userRole = req.user?.role as 'doctor' | 'patient';

      if (!userId || !userRole) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      if (!roomId) {
        return res.status(400).json({
          success: false,
          message: 'Room ID is required'
        });
      }

      const markMessagesAsReadUC = container.resolve(MarkMessagesAsReadUC);
      const count = await markMessagesAsReadUC.execute(roomId, userId, userRole);

      console.log(`✅ ${userRole} ${userId} marked ${count} messages as read in room ${roomId}`);

      return res.status(200).json({
        success: true,
        message: 'Messages marked as read',
        data: { count },
      });
    } catch (error: any) {
      console.error('Mark messages as read error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to mark messages as read',
      });
    }
  }

  async getUnreadCount(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role as 'doctor' | 'patient';

      if (!userId || !userRole) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      const getUnreadCountUC = container.resolve(GetUnreadCountUC);
      const count = await getUnreadCountUC.execute(userId, userRole);

      console.log(`✅ ${userRole} ${userId} has ${count} unread messages`);

      return res.status(200).json({
        success: true,
        message: 'Unread count retrieved',
        data: { count },
      });
    } catch (error: any) {
      console.error('Get unread count error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get unread count',
      });
    }
  }
}