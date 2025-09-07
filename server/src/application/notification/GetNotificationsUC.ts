import { injectable,inject } from "tsyringe";
import { INotificationRepository } from "../../domain/repositories/NotificationRepository";
import { Notification } from "../../domain/entities/Notification.entity";

@injectable()
export class GetNotificationsUC {
  constructor(
    @inject('INotificationRepository') private notificationRepo: INotificationRepository
  ) {}

  async execute(
    recipientId: string, 
    options?: { limit?: number; offset?: number; unreadOnly?: boolean }
  ): Promise<{
    notifications: Notification[];
    unreadCount: number;
  }> {
    try {
      const { limit = 50, offset = 0, unreadOnly = false } = options || {};

      let notifications: Notification[];
      
      if (unreadOnly) {
        notifications = await this.notificationRepo.findUnreadByRecipientId(recipientId);
      } else {
        notifications = await this.notificationRepo.findByRecipientId(recipientId, limit, offset);
      }

      const unreadCount = await this.notificationRepo.getUnreadCount(recipientId);

      return {
        notifications,
        unreadCount
      };
    } catch (error: any) {
      console.error('Get notifications error:', error);
      throw new Error(`Failed to get notifications: ${error.message}`);
    }
  }
}