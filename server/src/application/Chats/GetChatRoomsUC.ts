import { inject, injectable } from 'tsyringe';
import { IChatRepository } from '../../domain/repositories/ChatRepository';
import { ChatRoom } from '../../domain/entities/ChatMessage.enity';

@injectable()
export class GetChatRoomsUC {
  constructor(
    @inject('IChatRepository') private chatRepo: IChatRepository
  ) {}

  async execute(userId: string, userType: 'doctor' | 'patient'): Promise<ChatRoom[]> {
    return await this.chatRepo.getChatRoomsByUserId(userId, userType);
  }
}