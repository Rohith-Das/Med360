import { injectable,inject } from "tsyringe";   
import { IChatRepository } from "../../domain/repositories/ChatRepository";
import { ChatRoom} from "../../domain/entities/ChatRoom.entity";
import { IAppointmentRepository } from "../../domain/repositories/AppointmentRepository";

@injectable()
export class FindOrCreateChatRoomUC{
    constructor(@inject('IChatRepository')private chatRepo:IChatRepository,
    @inject('IAppointmentRepository')private appointmentRepo:IAppointmentRepository)
    {}

    async execute(
        doctorId:string,
        patientId:string
    ):Promise<ChatRoom>{
        let chatRoom=await this.chatRepo.findChatRoom(doctorId,patientId);
        if(chatRoom){
              console.log(`✅ Found existing chat room in uc: ${chatRoom.id}`);
      return chatRoom;
        }
        const appointments=await this.appointmentRepo.findAppointmentsByDoctorAndPatient(doctorId,patientId);
         if (!appointments || appointments.length === 0) {
      throw new Error('No appointment found between doctor and patient');
    }
     const lastAppointment = appointments.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];

    chatRoom = await this.chatRepo.createChatRoom({
      doctorId,
      patientId,
      lastAppointmentDate: lastAppointment.date,
      lastMessage: {
        text: '',
        timestamp: new Date(),
        senderType: 'patient'
      }
    });

    console.log(`✅ Created new chat room in uc: ${chatRoom.id}`);
    return chatRoom;
  }
}