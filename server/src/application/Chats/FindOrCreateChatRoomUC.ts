// server/src/application/Chats/FindOrCreateChatRoomUC.ts
import { injectable, inject } from "tsyringe";   
import { IChatRepository } from "../../domain/repositories/ChatRepository";
import { ChatRoom } from "../../domain/entities/ChatRoom.entity";

@injectable()
export class FindOrCreateChatRoomUC {
  constructor(
    @inject('IChatRepository') private chatRepo: IChatRepository
  ) {}

  async execute(doctorId: string, patientId: string): Promise<ChatRoom> {

    // 1. Check if chat room already exists
    let chatRoom = await this.chatRepo.findChatRoom(doctorId, patientId);
    
    if (chatRoom) {
      console.log(`✅ Found existing chat room: ${chatRoom.id}`);
      return chatRoom;
    }

    // 2. Create new chat room (NO appointment check)
    chatRoom = await this.chatRepo.createChatRoom({
      doctorId,
      patientId,
      lastAppointmentDate: null, // optional now
      lastMessage: {
        text: '',
        timestamp: new Date(),
        senderType: 'patient'
      }
    });

    console.log(`[NEW CHAT ROOM CREATED] Room ID: ${chatRoom.id} | Doctor: ${doctorId} | Patient: ${patientId}`);

    return chatRoom;
  }
}
