import { inject,injectable } from "tsyringe";
import { INotificationRepository } from "../../domain/repositories/NotificationRepository";
import { Notification } from "../../domain/entities/Notification.entity";
import { getSocketServer } from "../../infrastructure/socket/socketServer";

@injectable()

export class CreateNotificationUC{
    constructor(
        @inject('INotificationRepository')private notificationRepo:INotificationRepository
    ){}
    async execute(notification:Omit<Notification,'id'>):Promise<Notification>{
        try {
            const createdNotification=await this.notificationRepo.create(notification);

            try {
                const socketServer=getSocketServer();
                socketServer.sendToUser(
                    notification.recipientId,
                    'new_notification',
                    createdNotification
                )
                console.log(`Real-time notification sent to user:${notification.recipientId}`);
                
            } catch (error) {
               console.error('Failed to send real-time notification:', error);

            }
            return createdNotification;
        } catch (error:any) {
             console.error('Create notification error:', error);
      throw new Error(`Failed to create notification: ${error.message}`);
        }
    }
}