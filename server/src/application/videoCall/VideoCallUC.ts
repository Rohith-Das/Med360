import { injectable,inject } from "tsyringe";
import { IAppointmentRepository } from "../../domain/repositories/AppointmentRepository";
import { getSocketServer } from "../../infrastructure/socket/socketServer";

export interface VideoCallSession {
  roomId: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  status: 'waiting' | 'active' | 'ended';
  startedAt?: Date;
  endedAt?: Date;
}

@injectable()
export class VideoCallUseCase  {
    private activeSession=new Map<string,VideoCallSession>();
    
    constructor(
        @inject('IAppointmentRepository')
        private appointmentRepo:IAppointmentRepository
    ){}

    async initiateCall(appointmentId:string,initiatorId:string,initiatorRole:'doctor'|'patient'):Promise<VideoCallSession>{
        const appointment=await this.appointmentRepo.findById(appointmentId);
        if(!appointment){
        throw new Error('Appointment not found');      
        }

        const isAuth=
        (initiatorRole==='doctor' && appointment.doctorId===initiatorId)||
        (initiatorRole==='patient' && appointment.patientId===initiatorId)
        if(!isAuth){
          throw new Error('Unauthorized to initiate call for this appointment');
        }
        if (appointment.status !== 'confirmed') {
         throw new Error('Appointment must be confirmed to start video call');
       }
       const appointmentDate = new Date(appointment.date);
    const appointmentStart = new Date(`${appointmentDate.toDateString()} ${appointment.startTime}`);
    const appointmentEnd = new Date(`${appointmentDate.toDateString()} ${appointment.endTime}`);
    const now = new Date();
   
    const roomId = `appointment_${appointmentId}_${Date.now()}`;

    const session: VideoCallSession = {
  roomId,
  appointmentId: appointmentId.toString(),
  doctorId: appointment.doctorId.toString(),
  patientId: appointment.patientId.toString(),
  status: 'waiting',
  startedAt: now
};
    this.activeSession.set(roomId,session);

    //notify both incomming call
    const socketServer=getSocketServer();
    const callData={
        roomId,
        appointmentId,
        initiatorRole,
        initiatorId,
        callType:'video'
    }
    if (initiatorRole === 'doctor') {
      socketServer.sendToUser(appointment.patientId.toString(), 'incoming_video_call', callData);
    } else {
      socketServer.sendToUser(appointment.doctorId.toString(), 'incoming_video_call', callData);
    }
return session

    }

    async joinCall(roomId:string,userId:string):Promise<VideoCallSession|null>{
        const session=this.activeSession.get(roomId);
        if(!session){
           throw new Error('Video call session not found');  
        }
         if (session.doctorId !== userId && session.patientId !== userId) {
      throw new Error('Unauthorized to join this video call');
    }
     session.status = 'active';
    this.activeSession.set(roomId, session);

    return session;

    }

    async endCall(roomId:string,userId:string):Promise<boolean>{
      const session=this.activeSession.get(roomId);
      if(!session){
        return false
      }
       if (session.doctorId !== userId && session.patientId !== userId) {
      throw new Error('Unauthorized to end this video call');
    }
    session.status = 'ended';
    session.endedAt = new Date();

    const socketServer=getSocketServer();
    const otherUserId=session.doctorId===userId?session.patientId:session.doctorId;

    socketServer.sendToUser(otherUserId,'video_call_ended',{
      roomId,
      endedBy:userId,
      reason:'ended_by_user'
    })

    setTimeout(()=>{
      this.activeSession.delete(roomId);
    },5*60*1000)
    return true
    }

    getActiveSession(roomId:string):VideoCallSession|null{
      return this.activeSession.get(roomId)||null;
    }
    getSessionByUser(userId:string):VideoCallSession[]{
      return Array.from(this.activeSession.values()).filter(
        session=>session.doctorId===userId||session.patientId===userId
      )
    }
}