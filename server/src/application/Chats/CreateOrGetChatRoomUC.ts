import { injectable,inject } from "tsyringe";
import { IChatRepository } from "../../domain/repositories/ChatRepository";
import { IAppointmentRepository } from "../../domain/repositories/AppointmentRepository";

interface CreateOrGetChatRoomInput{
    doctorId:string;
    patientId:string;
    appointmentDate:Date;
}

@injectable()

export class createOrChatRoomUC{
     constructor(
    @inject('IChatRepository') private chatRepository: IChatRepository,
    @inject('IAppointmentRepository') private appointmentRepository: IAppointmentRepository
  ) {}

  async execute(input:CreateOrGetChatRoomInput):Promise<{chatRoomId:string;isNew:boolean}>{
    let chatRoom=await this.chatRepository.findChatRoom(input.doctorId,input.patientId)
    if(chatRoom){
        const updatedChatRoom=await this.chatRepository.updateLastAppointmentDate(chatRoom.id,input.appointmentDate)
        return {chatRoomId:updatedChatRoom.id,isNew:false}
    }else{
        const newChatRoom=await this.chatRepository.createChatRoom({
            doctorId:input.doctorId,
            patientId:input.patientId,
            lastAppointmentDate:input.appointmentDate,
        })
        return {chatRoomId:newChatRoom.id,isNew:true}
    }
  }
}