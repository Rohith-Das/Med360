import { injectable, inject } from 'tsyringe';
import { IVideoCallRepository } from '../../domain/repositories/VideoCallRepository';
import { RedisService } from '../../infrastructure/services/RedisService';
import { getSocketServer } from '../../infrastructure/socket/socketServer';
import { VideoCallSession } from '../../domain/entities/VideoCallSession.entity';

@injectable()
export class JoinVideoCallUC {
  constructor(
    @inject('IVideoCallRepository') private videoSessionRepo: IVideoCallRepository,
    @inject(RedisService) private redisService: RedisService
  ) {}

  async execute(roomId: string, userId: string, userRole: 'doctor' | 'patient'): Promise<VideoCallSession> {
const session = await this.videoSessionRepo.findByRoomId(roomId);
    if (!session) {
      throw new Error('Invalid or inactive video call session');
    }

    const isParticipant = session.doctorId === userId || session.patientId === userId;
    if (!isParticipant) {
      throw new Error('User not authorized for this video call');
    }
     if (session.status === 'waiting') {
      await this.videoSessionRepo.update(session.id!, {
        status: 'active',
        startedAt: new Date(),
      });
    }


    return session;
  }
}