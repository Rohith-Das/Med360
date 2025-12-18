import { VideoCallSession } from "../entities/VideoCallSession.entity";

export interface IVideoCallRepository {
  create(session: Omit<VideoCallSession, 'id'>): Promise<VideoCallSession>;
  findById(id: string): Promise<VideoCallSession | null>;
  findByAppointmentId(appointmentId: string): Promise<VideoCallSession | null>;
  findActiveByUserId(userId: string): Promise<VideoCallSession | null>; // Enforce single call
  update(id: string, updates: Partial<VideoCallSession>): Promise<VideoCallSession | null>;
  endSession(roomId: string): Promise<VideoCallSession | null>;
  findByRoomId(roomId: string): Promise<VideoCallSession | null>;
}