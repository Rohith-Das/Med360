import { injectable, inject } from 'tsyringe';
import { IChatRepository } from '../../domain/repositories/ChatRepository';

@injectable()
export class MarkMessagesReadUC {
  constructor(
    @inject('IChatRepository') private chatRepository: IChatRepository
  ) {}

  async execute(chatRoomId: string, userId: string, userType: 'doctor' | 'patient'): Promise<number> {
    const canAccess = await this.chatRepository.canAccessChat(chatRoomId, userId, userType);
    
    if (!canAccess) {
      throw new Error('Access denied to this chat room');
    }

    return await this.chatRepository.markMessagesAsRead(chatRoomId, userId, userType);
  }
}