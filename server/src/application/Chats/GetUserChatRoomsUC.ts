// server/src/application/Chats/GetUserChatRoomsUC.ts
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
    console.log(`📂 Fetching chat rooms for ${userType} ${userId}`);
    
    // 1. Fetch rooms with populated data
    const chatRooms = userType === 'doctor'
      ? await this.chatRepo.getDoctorChatRooms(userId, limit, offset)
      : await this.chatRepo.getPatientChatRooms(userId, limit, offset);

    console.log(`✅ Found ${chatRooms.length} chat rooms`);
    
    // Log first room to verify population
    if (chatRooms.length > 0) {
      console.log('📋 Sample room data:', JSON.stringify({
        id: chatRooms[0].id,
        doctorId: chatRooms[0].doctorId,
        patientId: chatRooms[0].patientId,
        doctor: chatRooms[0].doctorId,
        patient: chatRooms[0].patientId
      }, null, 2));
    }

    // 2. Get unread count per room
    const unreadCounts: Record<string, number> = {};
    
    for (const room of chatRooms) {
      try {
        const count = await this.chatRepo.getUnreadCount(room.id!, userType);
        unreadCounts[room.id!] = count;
      } catch (err) {
        console.error(`❌ Error getting unread count for room ${room.id}:`, err);
        unreadCounts[room.id!] = 0;
      }
    }

    console.log(`✅ Retrieved ${chatRooms.length} chat rooms with unread counts for ${userType} ${userId}`);

    return { chatRooms, unreadCounts };
  }
}