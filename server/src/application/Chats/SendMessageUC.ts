import { injectable,inject } from "tsyringe";
import { IChatRepository } from "../../domain/repositories/ChatRepository";
import { IAppointmentRepository } from "../../domain/repositories/AppointmentRepository";
import { ChatMessage } from "../../domain/entities/ChatMessage.enity";
import { getSocketServer } from "../../infrastructure/socket/socketServer";

@injectable()

export class SendMessageUC{
    constructor(
        @inject('IChatRepository')private chatRepo:IChatRepository,
        @inject('IAppointmentRepository')private appointmentRepo:IAppointmentRepository,
    ){}
    async execute(messageData:{
        appointmentId:string;
        senderId:string;
        senderType:'patient'|'doctor';
        messages:string;
        messageType?:'text'|'image'|'file';
        fileUrl?:string;
        fileName?:string;
        fileSize?:number;
    }):Promise<ChatMessage>{

        const appointment=await this.appointmentRepo.findById(messageData.appointmentId)
        if(!appointment){
            throw Error('appointment not found in sendMessage UC ')
        }

        const receiverId=messageData.senderType==='doctor'?appointment.patientId.toString():appointment.doctorId.toString();
        const receiverType=messageData.senderType==='doctor'?'patient':'doctor'
        
         const hasAccess = messageData.senderType === 'doctor' 
      ? appointment.doctorId === messageData.senderId
      : appointment.patientId === messageData.senderId;

    if (!hasAccess) {
      throw new Error('Unauthorized access to appointment');
    }
    
    //create a chat room if it doesn't exist
    let chatRoom=await this.chatRepo.findChatRoomByAppointment(messageData.appointmentId)
    if(!chatRoom){
        chatRoom=await this.chatRepo.createChatRoom({
            appointmentId:messageData.appointmentId,
            patientId:appointment.patientId as string,
            doctorId:appointment.doctorId as string,
            unreadCountDoctor:0,
            unreadCountPatient:0,
            isActive:true,
        })
    }
    const newMessage=await this.chatRepo.sendMessage({
        appointmentId:messageData.appointmentId,
        senderId:messageData.senderId,
        senderType:messageData.senderType,
        receiverId,
        receiverType,
        message:messageData.messages,
        messageType:messageData.messageType,
        fileName:messageData.fileName,
        fileSize:messageData.fileSize,
        fileUrl:messageData.fileUrl,
        isRead:false

    })
     //send notification
     try {
        const socketServer=getSocketServer();
        const socketEventData={
            messageId:newMessage.id,
            appointmentId:messageData.appointmentId,
            senderId:messageData.senderId,
            senderType:messageData.senderType,
            message:messageData.messages,
            messageType:messageData.messageType,
            fileUrl:messageData.fileUrl,
            fileName:messageData.fileName,
            filestamp:newMessage.createdAt
        }
        socketServer.sendToUser(receiverId,'new_chat_message',socketEventData);
        socketServer.sendToUser(receiverId,'chat_room_updated',{appointmenId:messageData.appointmentId})
        console.log(`chat message sent via socket to ${receiverType} ${receiverId}`);
        
     } catch (error) {
         console.error('Failed to send socket notification for chat message:', error);
     }
     return newMessage;
    }
}