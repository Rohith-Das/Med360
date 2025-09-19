import { inject, injectable } from 'tsyringe';
import { IChatRepository } from '../../domain/repositories/ChatRepository';
import { IAppointmentRepository } from '../../domain/repositories/AppointmentRepository';
import { ChatMessage } from '../../domain/entities/ChatMessage.enity';

@injectable()
export class GetChatMessagesUC {
  constructor(
    @inject('IChatRepository') private chatRepo: IChatRepository,
    @inject('IAppointmentRepository') private appointmentRepo: IAppointmentRepository
  ) {}

  async execute(
    appointmentId: string,
    userId: string,
    userType: 'doctor' | 'patient',
    page: number = 1,
    limit: number = 50
  ): Promise<{ messages: ChatMessage[]; total: number; hasMore: boolean; }> {
    // Verify appointment exists and user has access
    const appointment = await this.appointmentRepo.findById(appointmentId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const hasAccess = userType === 'doctor' 
      ? appointment.doctorId === userId
      : appointment.patientId === userId;

    if (!hasAccess) {
      throw new Error('Unauthorized access to appointment');
    }

    return await this.chatRepo.getMessageByAppointmentId(appointmentId, page, limit);
  }
}