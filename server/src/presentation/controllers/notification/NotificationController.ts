import { Response } from "express";
import { container } from "tsyringe";
import { GetNotificationsUC } from "../../../application/notification/GetNotificationsUC";
import { MarkAllNotificationsReadUC } from "../../../application/notification/MarkAllNotificationsReadUC";
import { MarkNotificationReadUC } from "../../../application/notification/MarkNotificationReadUC";
import { AuthRequest } from "../../middlewares/AuthRequest";


export class NotificationController{
    async getNotifications(req:AuthRequest,res:Response):Promise<Response>{
        try {
            const userId=req.user?.userId;
            if(!userId){
                return res.status(401).json({success:false,message:'unauthorized'})
            }
            const {limit,offset,unreadOnly}=req.params;
            const getNotificationUC=container.resolve(GetNotificationsUC);

            const result=await getNotificationUC.execute(userId,{
                limit:limit? parseInt(limit as string):undefined,
                offset:offset? parseInt(offset as string):undefined,
                unreadOnly:unreadOnly==='true'
            })
            return res.status(200).json({
                success:true,
                message:'Notification retieved successfully',
                data:result
            })
        } catch (error:any) {
            console.error('get notification error',error)
            return res.status(500).json({
                success:false,
                message:error.message||'failed to retrieve notifications'
            })
            
        }
    }
     async getUnreadNotifications(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const getNotificationsUC = container.resolve(GetNotificationsUC);
      const result = await getNotificationsUC.execute(userId, { unreadOnly: true });

      return res.status(200).json({
        success: true,
        message: 'Unread notifications retrieved successfully',
        data: result
      });
    } catch (error: any) {
      console.error('Get unread notifications error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve unread notifications'
      });
    }
  }
   async markNotificationAsRead(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const { notificationId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const markNotificationReadUC = container.resolve(MarkNotificationReadUC);
      await markNotificationReadUC.execute(notificationId);

      return res.status(200).json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error: any) {
      console.error('Mark notification read error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to mark notification as read'
      });
    }
  }
}