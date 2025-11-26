// src/infrastructure/services/RedisService.ts
import { redis } from "../config/redis";

export class RedisService {
  private readonly PRESCRIPTION_TTL = 3600; // 1 hour
  private readonly MEDICINE_SEARCH_TTL = 24 * 60 * 60; // 24 hours

  private handleRedisError(operation: string, error: any) {
    console.warn(`Redis ${operation} failed (continuing without cache):`, error.message);
    // Don't crash the app if Redis is down
  }

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
}