// src/application/Chats/GetUserChatRoomsUC.ts
import { injectable, inject } from 'tsyringe';
import { IChatRepository } from '../../domain/repositories/ChatRepository';
import { ChatRoom } from '../../domain/entities/ChatRoom.entity';

@injectable()
export class GetUserChatRoomsUC {
  constructor(
    @inject('IChatRepository') private chatRepo: IChatRepository
  ) {}

  async execute(
    userId: string,
    userType: 'doctor' | 'patient',
    limit = 50,
    offset = 0
  ): Promise<{ chatRooms: ChatRoom[]; unreadCounts: Record<string, number> }> {
    // 1. fetch rooms (already populated in repo)
    const chatRooms =
      userType === 'doctor'
        ? await this.chatRepo.getDoctorChatRooms(userId, limit, offset)
        : await this.chatRepo.getPatientChatRooms(userId, limit, offset);

    // 2. unread count per room
    const unreadCounts: Record<string, number> = {};
    for (const room of chatRooms) {
      const count = await this.chatRepo.getUnreadCount(room.id!, userType);
      unreadCounts[room.id!] = count;
    }

    console.log(`Retrieved ${chatRooms.length} chat rooms for ${userType} ${userId}`);
    return { chatRooms, unreadCounts };
  }
}