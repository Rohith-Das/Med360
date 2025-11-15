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
    // 1. Validate chat room
    const chatRoom = await this.chatRepo.findChatRoomById(data.chatRoomId);
    if (!chatRoom) {
      throw new Error('Chat room not found');
    }

    // 2. Authorization
    const isAuthorized =
      (data.senderType === 'doctor' && chatRoom.doctorId === data.senderId) ||
      (data.senderType === 'patient' && chatRoom.patientId === data.senderId);

    if (!isAuthorized) {
      throw new Error('Unauthorized to send message in this chat room');
    }

    // 3. Create message with correct defaults
    const message = await this.chatRepo.createMessage({
      chatRoomId: data.chatRoomId,
      senderId: data.senderId,
      senderType: data.senderType,
      message: data.message,
      messageType: data.messageType ?? 'text',
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      isRead: false,
      readBy: undefined, // ← FIX: not empty object
      status: 'sent',    // ← OK if enum includes 'sent'
      timestamp: new Date(), // ← ADD: for sorting & display
    });

    console.log(`Message sent: ${message.id} by ${data.senderType} ${data.senderId}`);
    return message;
  }
}