// src/domain/entities/VideoCallSession.entity.ts
export interface VideoCallSession {
  id: string;
  roomId: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  status: 'waiting' | 'active' | 'ended';
  initiatedBy: 'doctor' | 'patient';
  doctorName?: string;
  patientName?: string;
  startedAt?: Date;
  endedAt?: Date;
  durationSeconds?: number;
  createdAt: Date;
  updatedAt: Date;
  errorReason?: string; // Optional: For failed calls
}