import { injectable,inject } from "tsyringe";
import { IChatRepository } from "../../domain/repositories/ChatRepository";

interface GetMessagesInput{
    chatRoomId: string;
  userId: string;
  userType: 'doctor' | 'patient';
  limit?: number;
  skip?: number;
}

@injectable()

export class GetMessagesUC{
     constructor(
    @inject('IChatRepository') private chatRepository: IChatRepository
  ) {}
  async execute(input:GetMessagesInput):Promise<{messages:any[];total:number}>{
    const canAccess=await this.chatRepository.canAccessChat(
    input.chatRoomId,
      input.userId,
      input.userType
    )
    if(!canAccess){
      throw new Error('Access denied to this chat room');
    }

    const isActive=await this.chatRepository.isChatActive(input.chatRoomId);
     if (!isActive) {
      throw new Error('Chat session has expired');
    }

    const messages=await this.chatRepository.getMessages(
        input.chatRoomId,
        input.limit,
        input.skip
    )

    await this.chatRepository.markMessagesAsRead(
        input.chatRoomId,
        input.userId,
        input.userType
    )

    return {
        messages:messages.reverse(),
        total:messages.length

    }
  }
}