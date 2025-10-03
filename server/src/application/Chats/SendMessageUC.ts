import { injectable,inject } from "tsyringe";
import { IChatRepository } from "../../domain/repositories/ChatRepository";
import { getChatSocketServer } from "../../infrastructure/socket/chatSocketServer";

interface SendMessageInput{
 participantId: string;
  senderId: string;
  senderType: 'doctor' | 'patient';
  message: string;
  messageType: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

@injectable()
export class SendMessageUC{
    constructor(
    @inject('IChatRepository') private chatRepository: IChatRepository
  ) {}

  async execute(input:SendMessageInput):Promise<any>{
    let chatRoom;
    if(input.senderType==='patient'){
        chatRoom=await this.chatRepository.findChatRoom(input.participantId,input.senderId)
    }else{
        chatRoom=await this.chatRepository.findChatRoom(input.senderId,input.participantId)
    }

    if(!chatRoom){
      throw new Error('Chat room not found. Please book an appointment first.');     
    }

    const isActive=await this.chatRepository.isChatActive(chatRoom.id)
     if (!isActive) {
      throw new Error('Chat session has expired. Please book a new appointment.');
    }
    const chatMessage=await this.chatRepository.createMessage({
        chatRoomId:chatRoom.id,
        senderId:input.senderId,
        senderType:input.senderType,
        message:input.message,
        messageType: input.messageType,
      fileUrl: input.fileUrl,
      fileName: input.fileName,
      fileSize: input.fileSize,
    })

    const socketServer=getChatSocketServer()
    const chatRoomId=`${chatRoom.doctorId}_${chatRoom.patientId}`;

    socketServer.sendMessageToRoom(chatRoomId,{
         messageId: chatMessage.id,
      chatRoomId: chatRoom.id,
      senderId: chatMessage.senderId,
      senderType: chatMessage.senderType,
      message: chatMessage.message,
      messageType: chatMessage.messageType,
      fileUrl: chatMessage.fileUrl,
      fileName: chatMessage.fileName,
      fileSize: chatMessage.fileSize,
      createdAt: chatMessage.createdAt,
    })
    return chatMessage
  }
}