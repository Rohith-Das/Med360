import { injectable, inject } from 'tsyringe';
import { IChatRepository } from '../../domain/repositories/ChatRepository';

@injectable()
export class GetChatRoomsUC {
  constructor(
    @inject('IChatRepository') private chatRepository: IChatRepository
  ) {}

  async execute(userId: string, userType: 'doctor' | 'patient') {
    const chatRooms = await this.chatRepository.getUserChatRooms(userId, userType);
    
    // Get unread counts for each chat room
    const chatRoomsWithUnread = await Promise.all(
      chatRooms.map(async (room) => {
        const unreadCount = await this.chatRepository.getUnreadCount(
          room.id,
          userId,
          userType
        );

        return {
          ...room,
          unreadCount,
          isActive: room.isActive && room.expiresAt > new Date(),
        };
      })
    );

    return chatRoomsWithUnread;
  }
}