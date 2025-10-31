import { injectable, inject } from 'tsyringe';
import { IChatRepository } from '../../domain/repositories/ChatRepository';
import { ChatMessage } from '../../domain/entities/ChatMessage.entity';

@injectable()
export class GetChatRoomMessagesUC {
  constructor(
    @inject('IChatRepository') private chatRepo: IChatRepository
  ) {}

  async execute(
    roomId: string,
    userId: string,
    userType: 'doctor' | 'patient',
    limit = 50,
    offset = 0
  ): Promise<ChatMessage[]> {
    // Verify user is part of the chat room
    const chatRoom = await this.chatRepo.findChatRoomById(roomId);
    if (!chatRoom) {
      throw new Error('Chat room not found');
    }

    const isAuthorized = 
      (userType === 'doctor' && chatRoom.doctorId === userId) ||
      (userType === 'patient' && chatRoom.patientId === userId);

    if (!isAuthorized) {
      throw new Error('Unauthorized access to chat room');
    }

    // Get messages
    const messages = await this.chatRepo.getChatRoomMessages(roomId, limit, offset);
    console.log(`✅ Retrieved ${messages.length} messages from room ${roomId}`);
    return messages;
  }
}
