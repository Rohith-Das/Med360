import { inject,injectable } from "tsyringe";
import { INotificationRepository } from "../../../domain/repositories/NotificationRepository";
import { Notification } from "../../../domain/entities/Notification.entity";
import { NotificationModel } from "../models/NotificationModel";
import no from "zod/v4/locales/no.cjs";

@injectable()
export class MongoNotificationRepository implements INotificationRepository{
    async create(notification: Omit<Notification, "id">): Promise<Notification> {
        const newNotification= new NotificationModel(notification);
        const saved=await newNotification.save();
        return{
            id:saved._id.toString(),
            ...saved.toObject()
        }
    }
    async findById(id: string): Promise<Notification | null> {
        const notification=await NotificationModel.findById(id);
        if(!notification)return null
        return{
            id:notification._id.toString(),
            ...notification.toObject()
        }
    }
    async findByRecipientId(recipientId: string, limit: number = 50, offset: number = 0): Promise<Notification[]> {
    const notifications = await NotificationModel
      .find({ recipientId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    return notifications.map(notification => ({
      id: notification._id.toString(),
      ...notification
    }));
  }
  async findUnreadByRecipientId(recipientId: string): Promise<Notification[]> {
      const notifications=await NotificationModel
      .find({recipientId,isRead:false})
      .sort({createdAt:-1})
      .lean();
      return notifications.map(noti=>({
        id:noti._id.toString(),
        ...noti
      }))
  }
  async  markAsRead(id: string): Promise<Notification | null> {
        const updated = await NotificationModel.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );
    
    if (!updated) return null;
    return {
      id: updated._id.toString(),
      ...updated.toObject()
    };
  }
  async markAllAsRead(recipientId: string): Promise<number> {
       const result = await NotificationModel.updateMany(
      { recipientId, isRead: false },
      { isRead: true }
    );
    return result.modifiedCount;
  }
  async deleteById(id: string): Promise<boolean> {
      const result=await NotificationModel.findByIdAndDelete(id);
      return !!result;
  }
  async getUnreadCount(recipientId: string): Promise<number> {
      return await NotificationModel.countDocuments({
        recipientId,
        isRead:false
      })
  }
  async findByType(recipientId: string, type: string): Promise<Notification[]> {
      const notification=await NotificationModel
      .find({recipientId,type})
      .sort({createdAt:-1})
      .lean()
      return notification.map(noti=>({
        id:noti._id.toString(),
        ...noti
      }))
  }
 async update(id: string, updates: Partial<Notification>): Promise<Notification | null> {
      const updated=await NotificationModel.findByIdAndUpdate(
        id,
        updates,
        {new:true}
      );
      if(!updated) return null
      return {
        id:updated._id.toString(),
        ...updated.toObject()
      }
  }

}