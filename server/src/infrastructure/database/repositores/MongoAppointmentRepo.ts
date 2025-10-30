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
    const appointments = await AppointmentModel.find({ patientId })
      .populate("doctorId", "name specialization")
      .sort({ createdAt: -1 });
    return appointments.map(appointment => ({
      ...appointment.toObject(),
      id: appointment._id.toString(),
      doctor: appointment.doctorId ? {
        name: (appointment.doctorId as any).name,
        specialization: (appointment.doctorId as any).specialization
      } : undefined

    }));
  }

  async findByDoctorId(doctorId: string): Promise<Appointment[]> {
    const appointments = await AppointmentModel.find({ doctorId })
      .populate('patientId', "name email")
      .sort({ createdAt: -1 });
    return appointments.map(appointment => ({
      ...appointment.toObject(),
      id: appointment._id.toString(),

      patient: appointment.patientId ? {
        name: (appointment.patientId as any).name,
        email: (appointment.patientId as any).email
      } : undefined

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

  async getLastAppointmentDate(doctorId: string, patientId: string): Promise<Date | null> {
    const appointment = await AppointmentModel.findOne({ doctorId, patientId, status:{$in:['confirmed','completed']} })
      .sort({ date: -1 })
      .select('date');
    return appointment ? appointment.date : null;
  }
  async hasUpcomingAppointment(doctorId: string, patientId: string): Promise<boolean> {
    const now=new Date();
    const appointment=await AppointmentModel.findOne({
      doctorId,
      patientId,
      status:{$in:['pending','confirmed']},
      date:{$gte:now}
    })
    return !!appointment
  }
   async findAppointmentsByDoctorAndPatient(
    doctorId: string,
    patientId: string
  ): Promise<Appointment[]> {
    return await AppointmentModel.find({ doctorId, patientId }).sort({ date: -1 }).exec();
  }
}