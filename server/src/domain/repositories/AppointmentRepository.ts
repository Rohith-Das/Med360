import { Appointment } from "../entities/Appointment.entiry";

// src/domain/repositories/AppointmentRepository.ts
export interface IAppointmentRepository {
  create(appointment: Omit<Appointment, 'id'>): Promise<Appointment>;
  findById(id: string): Promise<Appointment | null>;
  findByPatientId(patientId: string): Promise<Appointment[]>;
  findByDoctorId(doctorId: string): Promise<Appointment[]>;
  update(id: string, updates: Partial<Appointment>): Promise<Appointment | null>;
  delete(id: string): Promise<boolean>;
}