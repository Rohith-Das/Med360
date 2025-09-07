import { Notification } from "../entities/Notification.entity";

export interface INotificationRepository{
    create(notification:Omit<Notification,'id'>):Promise<Notification>;
    findById(id:string):Promise<Notification|null>;
    findByRecipientId(recipientId:string ,limit?:number,offset?:number):Promise<Notification[]>;
    findUnreadByRecipientId(recipientId:string):Promise<Notification[]>
    markAsRead(id:string):Promise<Notification|null>;
    markAllAsRead(recipientId:string):Promise<number>;
    deleteById(id:string):Promise<boolean>;
    getUnreadCount(recipientId:string):Promise<number>;
    findByType(recipientId:string,type:string):Promise<Notification[]>
    update(id:string,updates:Partial<Notification>):Promise<Notification|null>
}