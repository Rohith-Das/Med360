import { injectable, inject } from 'tsyringe';
import { IChatRepository } from '../../domain/repositories/ChatRepository';
import { ChatMessage } from '../../domain/entities/ChatMessage.entity';

interface SendMessageDTO {
  chatRoomId: string;
  senderId: string;
  senderType: 'doctor' | 'patient';
  message: string;
  messageType?: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

@injectable()
export class SendMessageUC {
  constructor(
    @inject('IChatRepository') private chatRepo: IChatRepository
  ) {}

  async execute(data: SendMessageDTO): Promise<ChatMessage> {
    // Verify chat room exists
    const chatRoom = await this.chatRepo.findChatRoomById(data.chatRoomId);
    if (!chatRoom) {
      throw new Error('Chat room not found');
    }

    // Verify sender is part of the chat room
    const isAuthorized = 
      (data.senderType === 'doctor' && chatRoom.doctorId === data.senderId) ||
      (data.senderType === 'patient' && chatRoom.patientId === data.senderId);

    if (!isAuthorized) {
      throw new Error('Unauthorized to send message in this chat room');
    }

    // Create message
    const message = await this.chatRepo.createMessage({
      chatRoomId: data.chatRoomId,
      senderId: data.senderId,
      senderType: data.senderType,
      messageType: data.messageType || 'text',
      message: data.message,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      isRead: false,
      readBy: {},
      status: 'sent'
    });

    console.log(`✅ Message created: ${message.id}`);
    return message;
  }
}