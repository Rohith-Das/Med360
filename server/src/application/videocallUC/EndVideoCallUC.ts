// src/application/videoCall/EndVideoCallUC.ts
import { injectable, inject } from 'tsyringe';
import { IVideoCallRepository } from '../../domain/repositories/VideoCallRepository';

import { NotificationService } from '../notification/NotificationService';
import { RedisService } from '../../infrastructure/services/RedisService';
import { getSocketServer } from '../../infrastructure/socket/socketServer';
import { VideoCallSession } from '../../domain/entities/VideoCallSession.entity';

@injectable()
export class EndVideoCallUC {
  constructor(
    @inject('IVideoCallRepository') private videoSessionRepo: IVideoCallRepository,
    @inject(NotificationService) private notificationService: NotificationService,
    @inject(RedisService) private redisService: RedisService
  ) {}

  async execute(roomId: string, enderId: string): Promise<VideoCallSession> {
    const session = await this.videoSessionRepo.endSession(roomId);
  
    if (!session) {
      throw new Error('Video call session not found or already ended');
    }

    await this.redisService.deleteVideoCallSession(roomId);

    const otherUserId = session.doctorId === enderId ? session.patientId : session.doctorId;
    await this.notificationService.createVideoCallNotification({
      appointmentId: session.appointmentId,
      initiatorId: enderId,
      initiatorRole: session.doctorId === enderId ? 'doctor' : 'patient',
      recipientId: otherUserId,
      roomId,
      type: 'video_call_ended',
      title: 'Video Call Ended',
      message: 'The video call has ended',
      duration: session.durationSeconds,
    });

    const socketServer = getSocketServer();
    socketServer.sendToRoom(roomId, 'video_call_ended', { roomId, endedBy: enderId });

    return session;
  }
}