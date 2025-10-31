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
  ): Promise<{ chatRooms: ChatRoom[]; unreadCounts: Map<string, number> }> {
    let chatRooms: ChatRoom[];

    if (userType === 'doctor') {
      chatRooms = await this.chatRepo.getDoctorChatRooms(userId, limit, offset);
    } else {
      chatRooms = await this.chatRepo.getPatientChatRooms(userId, limit, offset);
    }

    // Get unread count for each room
    const unreadCounts = new Map<string, number>();
    for (const room of chatRooms) {
      const count = await this.chatRepo.getUnreadCount(room.id!, userType);
      unreadCounts.set(room.id!, count);
    }

    console.log(`✅ Retrieved ${chatRooms.length} chat rooms for ${userType} ${userId}`);
    return { chatRooms, unreadCounts };
  }
}
