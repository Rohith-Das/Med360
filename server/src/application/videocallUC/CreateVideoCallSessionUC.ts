// src/application/videoCall/CreateVideoCallSessionUC.ts

import { injectable, inject } from 'tsyringe';
import { IVideoCallRepository } from '../../domain/repositories/VideoCallRepository';
import { IAppointmentRepository } from '../../domain/repositories/AppointmentRepository';
import { VideoCallSession } from '../../domain/entities/VideoCallSession.entity';
import { NotificationService } from '../notification/NotificationService';
import { getSocketServer } from '../../infrastructure/socket/socketServer';
import { RedisService } from '../../infrastructure/services/RedisService';
import { v4 as uuidv4 } from 'uuid'; // ← Now works perfectly!

@injectable()
export class CreateVideoCallSessionUC {
  constructor(
    @inject('IVideoCallRepository') private videoCallRepo: IVideoCallRepository,
    @inject('IAppointmentRepository') private appointmentRepo: IAppointmentRepository, // Fixed typo
    @inject(NotificationService) private notificationService: NotificationService,
    @inject(RedisService) private redisService: RedisService
  ) {}

  // Remove the async generateRoomId — no longer needed
  private generateRoomId(): string {
    return `video-room-${uuidv4()}`;
  }

  async execute(
    appointmentId: string,
    initiatorId: string,
    initiatorRole: 'doctor' | 'patient'
  ): Promise<VideoCallSession> {
    const appointment = await this.appointmentRepo.findById(appointmentId);
    if (!appointment || appointment.status !== 'confirmed') {
      throw new Error('Invalid or unconfirmed appointment');
    }

    const roomId = this.generateRoomId();
    console.log('Room ID created:', roomId);

    const doctorId =
      initiatorRole === 'doctor' ? initiatorId : appointment.doctorId.toString();

    const patientId =
      initiatorRole === 'patient' ? initiatorId : appointment.patientId.toString();

    const session: Omit<VideoCallSession, 'id'> = {
      roomId,
      appointmentId,
      doctorId,
      patientId,
      status: 'waiting',
      initiatedBy: initiatorRole,
      createdAt: new Date(),
      updatedAt: new Date(),
      startedAt: new Date(),
    };

    const createdSession = await this.videoCallRepo.create(session);
    await this.redisService.setVideoCallSession(roomId, createdSession);

    const recipientId = initiatorRole === 'doctor' ? patientId : doctorId;

    await this.notificationService.createVideoCallNotification({
      appointmentId,
      initiatorId,
      initiatorRole,
      recipientId,
      roomId,
      type: 'video_call_initiated',
      title: 'Incoming Video Call',
      message: `${
        initiatorRole === 'doctor' ? 'Dr. ' : ''
      }${initiatorId} is starting a video call`,
      appointmentTime: appointment.startTime,
    });

    const socketServer = getSocketServer();
    socketServer.sendToUser(recipientId, 'video_call_initiated', {
      roomId,
      appointmentId,
      initiatorId,
      initiatorRole,
    });

    return createdSession;
  }
}