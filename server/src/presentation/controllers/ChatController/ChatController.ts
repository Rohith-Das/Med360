import { Response,Request } from "express";
import { container } from "tsyringe";
import { AuthRequest } from "../../middlewares/AuthRequest";
import { SendMessageUC } from "../../../application/Chats/SendMessageUC";
import { GetChatMessagesUC } from "../../../application/Chats/GetChatMessageUC";
import { GetChatRoomsUC } from "../../../application/Chats/GetChatRoomsUC";
import { MarkMessagesReadUC } from "../../../application/Chats/MarkMessagesReadUC";
import { IChatRepository } from "../../../domain/repositories/ChatRepository";

export class ChatController{
    async sendMessage(req:AuthRequest,res:Response):Promise<Response>{
        try {
            const {appointmentId,messages,messageType,fileUrl,fileName,fileSize}=req.body;
            const userId=req.user?.userId;
            const userRole=req.user?.role;
              if (!userId || !userRole) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      if (!appointmentId || !messages) {
        return res.status(400).json({ 
          success: false, 
          message: 'Appointment ID and message are required' 
        });
      }
      const sendMessageUC=container.resolve(SendMessageUC);
      const chatMesage=await sendMessageUC.execute({
        appointmentId,
        senderId:userId,
        senderType:userRole==='patient'?'patient':'doctor',
        messages,
        messageType,
        fileName,
        fileSize,
        fileUrl
      })
      return res.status(201).json({
        success:true,
        message:'message send successfully',
        data:chatMesage
      })
        } catch (error:any) {
            console.log('send message error',error)
            return res.status(400).json({
                success:false,
                message:error.message||'failed to send message'
            })
            
        }
    }
    async getChatMessages(req:AuthRequest,res:Response):Promise<Response>{
        try {
            const {appointmentId}=req.params;
            const {page=1,limit=50}=req.query;
            const userId=req.user?.userId;
            const userRole=req.user?.role;
            if (!userId || !userRole) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const UC=container.resolve(GetChatMessagesUC);
      const result=await UC.execute(
        appointmentId,
        userId,
        userRole==='patient'?'patient':'doctor',
        parseInt(page as string),
        parseInt(limit as string)
      )
      return res.status(200).json({
        success:true,
        message:'message retirieved successfully',
        data:result
      })
        } catch (error:any) {
            console.log('get chat failed',error)
            return res.status(400).json({
                success:false,
                message:error.message||'failed to retrieve message'
            })
        }
    }
     async getChatRooms(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const getChatRoomsUC = container.resolve(GetChatRoomsUC);
      const chatRooms = await getChatRoomsUC.execute(
        userId,
        userRole === 'patient' ? 'patient' : 'doctor'
      );

      return res.status(200).json({
        success: true,
        message: 'Chat rooms retrieved successfully',
        data: chatRooms
      });
    } catch (error: any) {
      console.error('Get chat rooms error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve chat rooms'
      });
    }
  }
  async markMessagesRead(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { appointmentId } = req.params;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const markMessagesReadUC = container.resolve(MarkMessagesReadUC);
      await markMessagesReadUC.execute(
        appointmentId,
        userId,
        userRole === 'patient' ? 'patient' : 'doctor'
      );

      return res.status(200).json({
        success: true,
        message: 'Messages marked as read'
      });
    } catch (error: any) {
      console.error('Mark messages read error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to mark messages as read'
      });
    }
  }

  async getUnreadMessageCount(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { appointmentId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

const chatRepo = container.resolve<IChatRepository>("IChatRepository");      const unreadCount = await chatRepo.getUnreadMessageCount(appointmentId, userId);

      return res.status(200).json({
        success: true,
        message: 'Unread count retrieved successfully',
        data: { unreadCount }
      });
    } catch (error: any) {
      console.error('Get unread count error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to get unread count'
      });
    }
  }
}