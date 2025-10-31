import { injectable, inject } from 'tsyringe';
import { IChatRepository } from '../../domain/repositories/ChatRepository';

@injectable()
export class MarkMessagesAsReadUC {
  constructor(
    @inject('IChatRepository') private chatRepo: IChatRepository
  ) {}

  async execute(
    roomId: string,
    userId: string,
    userType: 'doctor' | 'patient'
  ): Promise<number> {
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

    // Mark messages as read
    const count = await this.chatRepo.markMessagesAsRead(roomId, userType);
    console.log(`✅ Marked ${count} messages as read in room ${roomId}`);
    return count;
  }
}