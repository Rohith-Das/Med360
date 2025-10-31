import { injectable, inject } from 'tsyringe';
import { IChatRepository } from '../../domain/repositories/ChatRepository';

@injectable()
export class GetUnreadCountUC {
  constructor(
    @inject('IChatRepository') private chatRepo: IChatRepository
  ) {}

  async execute(userId: string, userType: 'doctor' | 'patient'): Promise<number> {
    const count = await this.chatRepo.getAllUnreadCount(userId, userType);
    console.log(`✅ Total unread messages for ${userType} ${userId}: ${count}`);
    return count;
  }
}