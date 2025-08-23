// src/infrastructure/database/repositories/MongoAppointmentRepo.ts
import { injectable } from 'tsyringe';
import { IAppointmentRepository } from '../../../domain/repositories/AppointmentRepository';
import { Appointment } from '../../../domain/entities/Appointment.entiry';
import { AppointmentModel } from '../models/AppointmentModel';

@injectable()
export class MongoAppointmentRepo implements IAppointmentRepository {
  async create(appointment: Omit<Appointment, 'id'>): Promise<Appointment> {
    const newAppointment = new AppointmentModel(appointment);
    const saved = await newAppointment.save();
    return {
      id: saved._id.toString(),
      ...saved.toObject(),
    };
  }

  async findById(id: string): Promise<Appointment | null> {
    const appointment = await AppointmentModel.findById(id);
    if (!appointment) return null;
    return {
      id: appointment._id.toString(),
      ...appointment.toObject(),
    };
  }

  async findByPatientId(patientId: string): Promise<Appointment[]> {
    const appointments = await AppointmentModel.find({ patientId }).sort({ createdAt: -1 });
    return appointments.map(appointment => ({
      id: appointment._id.toString(),
      ...appointment.toObject(),
    }));
  }

  async findByDoctorId(doctorId: string): Promise<Appointment[]> {
    const appointments = await AppointmentModel.find({ doctorId }).sort({ createdAt: -1 });
    return appointments.map(appointment => ({
      id: appointment._id.toString(),
      ...appointment.toObject(),
    }));
  }

  async update(id: string, updates: Partial<Appointment>): Promise<Appointment | null> {
    const updated = await AppointmentModel.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) return null;
    return {
      id: updated._id.toString(),
      ...updated.toObject(),
    };
  }

  async delete(id: string): Promise<boolean> {
    const result = await AppointmentModel.findByIdAndDelete(id);
    return !!result;
  }
}