import { container, injectable } from "tsyringe";
import { IVideoCallRepository } from "../../../domain/repositories/VideoCallRepository";
import { VideoCallSession } from "../../../domain/entities/VideoCallSession.entity";
import { VideoCallSessionModel } from "../models/VideoCallSessionModel";
import { RedisService } from "../../services/RedisService";


@injectable()
export class MongoVideoCallRepo implements IVideoCallRepository{
    private redisService:RedisService;
    constructor(){
        this.redisService=container.resolve(RedisService)
    }


  async create(session: Omit<VideoCallSession, 'id'>): Promise<VideoCallSession> {
    const newSession = new VideoCallSessionModel(session);
    const saved = await newSession.save();
    return {
      ...saved.toObject(),
      id: saved._id.toString(),
    };
  }
    async findById(id: string): Promise<VideoCallSession | null> {
    const session = await VideoCallSessionModel.findById(id);
    return session ? { ...session.toObject(), id: session._id.toString() } : null;
  }

  async findByAppointmentId(appointmentId: string): Promise<VideoCallSession | null> {
    const session = await VideoCallSessionModel.findOne({ appointmentId });
    return session ? { ...session.toObject(), id: session._id.toString() } : null;
  }

  async findActiveByUserId(userId: string): Promise<VideoCallSession | null> {
    const session = await VideoCallSessionModel.findOne({
      $or: [{ doctorId: userId }, { patientId: userId }],
      status: { $in: ['waiting', 'active'] },
    });
    return session ? { ...session.toObject(), id: session._id.toString() } : null;
  }

  async update(id: string, updates: Partial<VideoCallSession>): Promise<VideoCallSession | null> {
    const updated = await VideoCallSessionModel.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) return null;
    const entity = { ...updated.toObject(), id: updated._id.toString() };

    // Update Redis cache
    await this.redisService.setVideoCallSession(entity.roomId, entity);

    return entity;
  }
  async findByRoomId(roomId: string): Promise<VideoCallSession | null> {
  const doc = await VideoCallSessionModel.findOne({ roomId });
  if (!doc) return null;

  return {
    id: doc._id.toString(),
    roomId: doc.roomId,
    appointmentId: doc.appointmentId,
    doctorId: doc.doctorId.toString(),
    patientId: doc.patientId.toString(),
    status: doc.status,
    initiatedBy: doc.initiatedBy,
    startedAt: doc.startedAt,
    endedAt: doc.endedAt,
    durationSeconds: doc.durationSeconds,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

  async endSession(roomId: string): Promise<VideoCallSession | null> {
const session = await this.findByRoomId(roomId);// Adjust if needed
    if (!session) return null;

    session.status = 'ended';
    session.endedAt = new Date();
    // Duration calc already in pre-save hook
  const updated = await VideoCallSessionModel.findOneAndUpdate(
    { roomId },
    {
      status: 'ended',
      endedAt: new Date(),
    },
    { new: true }
  );

    return updated;
  }
}