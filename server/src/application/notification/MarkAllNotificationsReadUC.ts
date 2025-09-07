import { inject, injectable } from 'tsyringe';
import { INotificationRepository } from '../../domain/repositories/NotificationRepository';
import { getSocketServer } from '../../infrastructure/socket/socketServer';

@injectable()
export class MarkAllNotificationsReadUC {
  constructor(
    @inject('INotificationRepository') private notificationRepo: INotificationRepository
  ) {}

  async execute(recipientId: string): Promise<number> {
    try {
      const updatedCount = await this.notificationRepo.markAllAsRead(recipientId);

      // Send real-time update
      try {
        const socketServer = getSocketServer();
        socketServer.sendToUser(
          recipientId,
          'all_notifications_read_update',
          { updatedCount, unreadCount: 0 }
        );
      } catch (socketError) {
        console.error('Failed to send read all update:', socketError);
      }

      return updatedCount;
    } catch (error: any) {
      console.error('Mark all notifications read error:', error);
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
  }
}