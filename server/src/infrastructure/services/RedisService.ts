// src/infrastructure/services/RedisService.ts
import { redis } from "../config/redis";

export class RedisService {
  private readonly PRESCRIPTION_TTL = 3600; // 1 hour
  private readonly MEDICINE_SEARCH_TTL = 24 * 60 * 60; // 24 hours
  private readonly SOCKET_TTL = 60 * 60 * 6; // 6 hours
  private readonly VIDEO_CALL_TTL = 60 * 60 * 24;

  private handleRedisError(operation: string, error: any) {
    console.warn(`Redis ${operation} failed (continuing without cache):`, error?.message);
  }

  // -------------------- Prescription Cache --------------------

  async cachePrescription(appointmentId: string, prescription: any): Promise<void> {
    const key = `prescription:${appointmentId}`;
    try {
      await redis.setex(key, this.PRESCRIPTION_TTL, JSON.stringify(prescription));
    } catch (error) {
      this.handleRedisError("cachePrescription", error);
    }
  }

  async getCachedPrescription(appointmentId: string): Promise<any | null> {
    const key = `prescription:${appointmentId}`;
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.handleRedisError("getCachedPrescription", error);
      return null;
    }
  }

  async invalidatePrescriptionCache(appointmentId: string): Promise<void> {
    const key = `prescription:${appointmentId}`;
    try {
      await redis.del(key);
    } catch (error) {
      this.handleRedisError("invalidatePrescriptionCache", error);
    }
  }

  // -------------------- Medicine Search Cache --------------------

  async cacheMedicineSearch(query: string, suggestions: string[]): Promise<void> {
    const key = `medicine:search:${query.toLowerCase()}`;
    try {
      await redis.setex(key, this.MEDICINE_SEARCH_TTL, JSON.stringify(suggestions));
    } catch (error) {
      this.handleRedisError("cacheMedicineSearch", error);
    }
  }

  async getCachedMedicineSearch(query: string): Promise<string[] | null> {
    const key = `medicine:search:${query.toLowerCase()}`;
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.handleRedisError("getCachedMedicineSearch", error);
      return null;
    }
  }

  // -------------------- Socket User Mapping (HARDENED) --------------------

  async setSocketIdForUser(userId: string, socketId: string): Promise<void> {
    try {
      // Main lookup
      await redis.hset("active_users", userId, socketId);

      // TTL safety (for crash recovery)
      await redis.setex(`active_user:${userId}`, this.SOCKET_TTL, socketId);
    } catch (error) {
      this.handleRedisError("setSocketIdForUser", error);
    }
  }

  async getSocketIdForUser(userId: string): Promise<string | null> {
    try {
      return await redis.hget("active_users", userId);
    } catch (error) {
      this.handleRedisError("getSocketIdForUser", error);
      return null;
    }
  }

  async deleteUserSocketId(userId: string): Promise<void> {
    try {
      await redis.hdel("active_users", userId);
      await redis.del(`active_user:${userId}`);
    } catch (error) {
      this.handleRedisError("deleteUserSocketId", error);
    }
  }
async setVideoCallSession(roomId: string, session: any): Promise<void> {
  const key = `video_session:${roomId}`;
  try {
    await redis.setex(key, this.VIDEO_CALL_TTL, JSON.stringify(session));
  } catch (error) {
    this.handleRedisError("setVideoCallSession", error);
  }
}

async getVideoCallSession(roomId: string): Promise<any | null> {
  const key = `video_session:${roomId}`;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    this.handleRedisError("getVideoCallSession", error);
    return null;
  }
}

async deleteVideoCallSession(roomId: string): Promise<void> {
  const key = `video_session:${roomId}`;
  try {
    await redis.del(key);
  } catch (error) {
    this.handleRedisError("deleteVideoCallSession", error);
  }
}

async getAllActiveVideoCallSessions(): Promise<any[]> {
  try {
    const keys = await redis.keys("video_session:*");
    if (!keys.length) return [];

    const values = await redis.mget(...keys);
    return values
      .filter(Boolean)
      .map(v => JSON.parse(v as string));
  } catch (error) {
    this.handleRedisError("getAllActiveVideoCallSessions", error);
    return [];
  }
}
}
