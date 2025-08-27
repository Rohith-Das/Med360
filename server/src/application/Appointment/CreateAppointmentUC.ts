// src/application/Appointment/CreateAppointmentUC.ts
import { inject, injectable } from 'tsyringe';
import { IAppointmentRepository } from '../../domain/repositories/AppointmentRepository';
import { Appointment } from '../../domain/entities/Appointment.entiry';
import { IScheduleRepository } from '../../domain/repositories/ScheduleRepository-method';

interface CreateAppointmentInput {
  patientId: string;
  doctorId: string;
  scheduleId: string;
  timeSlotId: string;
  date: Date;
  startTime: string;
  endTime: string;
  consultationFee: number;
   paymentMethod?: 'stripe' | 'wallet';
}

@injectable()
export class CreateAppointmentUC {
  constructor(
    @inject('IAppointmentRepository') private appointmentRepo: IAppointmentRepository,
     @inject('IScheduleRepository') private scheduleRepo: IScheduleRepository
  ) {}

  async execute(input: CreateAppointmentInput): Promise<Appointment> {
    try {
       const schedule = await this.scheduleRepo.findById(input.scheduleId);
      if (!schedule) {
        throw new Error('Schedule not found');
      }

      const timeSlot = schedule.timeSlots.find(slot => {
        const slotId = slot._id?.toString() || slot.id?.toString();
        return slotId === input.timeSlotId;
      });

      if (!timeSlot) {
        throw new Error('Time slot not found');
      }

      if (timeSlot.isBooked) {
        throw new Error('Time slot is already booked');
      }

      if (!timeSlot.isActive) {
        throw new Error('Time slot is not available');
      }

      const appointment = await this.appointmentRepo.create({
        patientId: input.patientId,
        doctorId: input.doctorId,
        scheduleId: input.scheduleId,
        timeSlotId: input.timeSlotId,
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
       status: input.paymentMethod === 'wallet' ? 'confirmed' : 'pending',
        paymentStatus: input.paymentMethod === 'wallet' ? 'paid' : 'pending',
        consultationFee: input.consultationFee,
      });
      if (input.paymentMethod === 'wallet') {
        await this.scheduleRepo.updateTimeSlot(input.scheduleId, input.timeSlotId, {
          isBooked: true,
          patientId: input.patientId
        });
      }

      return appointment;
    } catch (error: any) {
      console.error('Create appointment error:', error);
      throw new Error(`Appointment creation failed: ${error.message}`);
    }
  }
}