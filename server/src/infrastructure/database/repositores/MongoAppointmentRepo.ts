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
        ...saved.toObject(),
      id: saved._id.toString(),
    
    };
  }

  async findById(id: string): Promise<Appointment | null> {
    const appointment = await AppointmentModel.findById(id);
    if (!appointment) return null;
    return {
       ...appointment.toObject(),
      id: appointment._id.toString(),
     
    };
  }

  async findByPatientId(patientId: string): Promise<Appointment[]> {
    const appointments = await AppointmentModel.find({ patientId }).sort({ createdAt: -1 });
    return appointments.map(appointment => ({
          ...appointment.toObject(),
      id: appointment._id.toString(),
  
    }));
  }

  async findByDoctorId(doctorId: string): Promise<Appointment[]> {
    const appointments = await AppointmentModel.find({ doctorId }).sort({ createdAt: -1 });
    return appointments.map(appointment => ({
        ...appointment.toObject(),
      id: appointment._id.toString(),
    
    }));
  }

  async update(id: string, updates: Partial<Appointment>): Promise<Appointment | null> {
    const updated = await AppointmentModel.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) return null;
    return {
          ...updated.toObject(),
      id: updated._id.toString(),
  
    };
  }

  async delete(id: string): Promise<boolean> {
    const result = await AppointmentModel.findByIdAndDelete(id);
    return !!result;
  }
}