import { ChatRoom,ChatMessage } from "../entities/ChatMessage.enity";

export interface IChatRepository{
    createChatRoom(chatRoom:ChatRoom):Promise<ChatRoom>;
    findChatRoomByAppointment(appointmentId:string):Promise<ChatRoom|null>;
    updateChatRoom(roomId:string,updates:Partial<ChatRoom>):Promise<ChatRoom>;
    getChatRoomsByUserId(userId:string,userType:'doctor'|'patient'):Promise<ChatRoom[]>;

    sendMessage(message:ChatMessage):Promise<ChatMessage>;
    getMessageByAppointmentId(appointmentId:string,page?:number,limit?:number):Promise<{
        messages:ChatMessage[];
        total:number;
        hasMore:boolean;
    }>;
    markMessagesAsRead(appointmentId:string,userId:string,userType:'doctor'|'patient'):Promise<void>;
    getUnreadMessageCount(appointmentId:string,userId:string):Promise<number>
    
}