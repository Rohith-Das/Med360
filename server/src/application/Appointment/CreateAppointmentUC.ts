// src/application/Appointment/CreateAppointmentUC.ts
import { inject, injectable } from 'tsyringe';
import { IAppointmentRepository } from '../../domain/repositories/AppointmentRepository';
import { Appointment } from '../../domain/entities/Appointment.entiry';

interface CreateAppointmentInput {
  patientId: string;
  doctorId: string;
  scheduleId: string;
  timeSlotId: string;
  date: Date;
  startTime: string;
  endTime: string;
  consultationFee: number;
}

@injectable()
export class CreateAppointmentUC {
  constructor(
    @inject('IAppointmentRepository') private appointmentRepo: IAppointmentRepository
  ) {}

  async execute(input: CreateAppointmentInput): Promise<Appointment> {
    try {
      const appointment = await this.appointmentRepo.create({
        patientId: input.patientId,
        doctorId: input.doctorId,
        scheduleId: input.scheduleId,
        timeSlotId: input.timeSlotId,
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        status: 'pending',
        paymentStatus: 'paid',
        consultationFee: input.consultationFee,
      });

      return appointment;
    } catch (error: any) {
      console.error('Create appointment error:', error);
      throw new Error(`Appointment creation failed: ${error.message}`);
    }
  }
}