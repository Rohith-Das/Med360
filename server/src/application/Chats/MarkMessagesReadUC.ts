import { inject, injectable } from 'tsyringe';
import { IChatRepository } from '../../domain/repositories/ChatRepository';
import { IAppointmentRepository } from '../../domain/repositories/AppointmentRepository';
import { getSocketServer } from '../../infrastructure/socket/socketServer';

@injectable()
export class MarkMessagesReadUC {
  constructor(
    @inject('IChatRepository') private chatRepo: IChatRepository,
    @inject('IAppointmentRepository') private appointmentRepo: IAppointmentRepository
  ) {}

  async execute(appointmentId: string, userId: string, userType: 'doctor' | 'patient'): Promise<void> {
    // Verify appointment access
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

    await this.chatRepo.markMessagesAsRead(appointmentId, userId, userType);

    // Notify other participant that messages have been read
    try {
      const socketServer = getSocketServer();
      const otherUserId = userType === 'doctor' ? appointment.patientId.toString() : appointment.doctorId.toString();
      
      socketServer.sendToUser(otherUserId, 'messages_marked_read', {
        appointmentId,
        readByUserId: userId,
        readByUserType: userType
      });
    } catch (error) {
      console.error('Failed to send read receipt via socket:', error);
    }
  }
}