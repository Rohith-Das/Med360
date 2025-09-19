import { injectable } from "tsyringe";
import { IChatRepository } from "../../../domain/repositories/ChatRepository";
import { ChatMessage,ChatRoom } from "../../../domain/entities/ChatMessage.enity";
import { ChatMessageModel } from "../models/ChatMessage.model";
import { ChatRoomModel } from "../models/ChatRoom.model";

@injectable()

export class MongoChatRepository implements IChatRepository{
    async createChatRoom(chatRoom: ChatRoom): Promise<ChatRoom> {
        const newChatRoom=new ChatRoomModel(chatRoom);
        const savedChatRoom=await newChatRoom.save();
        return {id:savedChatRoom._id.toString(),...savedChatRoom.toObject()}
    }

    async findChatRoomByAppointment(appointmentId: string): Promise<ChatRoom | null> {
        const chatRoom=await ChatRoomModel.findOne({appointmentId});
        if(!chatRoom) return null;
        return {id:chatRoom._id.toString(),...chatRoom.toObject()}
    }
    async updateChatRoom(roomId: string, updates: Partial<ChatRoom>): Promise<ChatRoom> {
        const updated=await ChatRoomModel.findByIdAndUpdate(roomId,updates,{new:true});
        if(!updated) throw new Error('Chat room not found');
        return {id:updated._id.toString(),...updated.toObject()}
    }
    async getChatRoomsByUserId(userId: string, userType: "doctor" | "patient"): Promise<ChatRoom[]> {
        const query=userType==='doctor'?{doctorId:userId}:{patientId:userId};
        const chatRoom=await ChatRoomModel.find({...query,isActive:true})
        .sort({lastMesageAt:-1,createdAt:-1})
        .lean()
        return chatRoom.map(room=>({id:room._id.toString(),...room}))as ChatRoom[];
    }
    async sendMessage(message: ChatMessage): Promise<ChatMessage> {
        const newMessage=new ChatMessageModel(message);
        const savedMessage=await newMessage.save()
        await ChatRoomModel.findOneAndUpdate(
            {appointmentId:message.appointmentId},
            {
                lastMessage:message.message,
                lastMessageAt:new Date(),
                $inc:message.receiverType==='doctor'?
                {unreadCountDoctor:1}:{unreadCountPatient:1}
            }
        )
        return {id:savedMessage._id.toString(),...savedMessage.toObject()}
    }
    async getMessageByAppointmentId(appointmentId: string, page: number=1, limit: number=50): Promise<{ messages: ChatMessage[]; total: number; hasMore: boolean; }> {
        const skip=(page-1)*limit;
        const [messages,total]=await Promise.all([
            ChatMessageModel.find({appointmentId})
            .sort({createdAt:-1})
            .skip(skip)
            .limit(limit)
            .lean(),
            ChatMessageModel.countDocuments({appointmentId})
        ])
        const hasMore=skip + messages.length<total;
        const formattedMessage=messages.reverse().map(msg=>({
            id:msg._id.toString(),...msg
        })) as ChatMessage[]
        return {messages:formattedMessage,total,hasMore}
    }
    async markMessagesAsRead(appointmentId: string, userId: string, userType: "doctor" | "patient"): Promise<void> {
        const now=new Date();
        await ChatMessageModel.updateMany({
            appointmentId,
            receiverId:userId,
            receiverType:userType,
            isRead:false
        },{
            isRead:true,
            readAt:now
        })
        const unreadFiled=userType==='doctor'?'unreadCountDoctor':'unreadCountPatient';
        await ChatRoomModel.findOneAndUpdate({appointmentId},{[unreadFiled]:0})
    }
    async  getUnreadMessageCount(appointmentId: string, userId: string): Promise<number> {
        const result=await ChatMessageModel.countDocuments({
            appointmentId,
            receiverId:userId,
            isRead:false
        })
         return result;
    }
}