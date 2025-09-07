import { inject, injectable } from 'tsyringe';
import { INotificationRepository } from '../../domain/repositories/NotificationRepository';
import { getSocketServer } from '../../infrastructure/socket/socketServer';

@injectable()
export class MarkNotificationReadUC {
  constructor(
    @inject('INotificationRepository') private notificationRepo: INotificationRepository
  ) {}

  async execute(notificationId: string): Promise<boolean> {
    try {
      const notification = await this.notificationRepo.markAsRead(notificationId);
      
      if (!notification) {
        throw new Error('Notification not found');
      }

      // Send real-time update
      try {
        const socketServer = getSocketServer();
        const unreadCount = await this.notificationRepo.getUnreadCount(notification.recipientId);
        socketServer.sendToUser(
          notification.recipientId,
          'notification_read_update',
          { notificationId, unreadCount }
        );
      } catch (socketError) {
        console.error('Failed to send read update:', socketError);
      }

      return true;
    } catch (error: any) {
      console.error('Mark notification read error:', error);
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }
}
