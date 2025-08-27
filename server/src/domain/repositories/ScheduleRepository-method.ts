import { Schedule } from "../entities/Schedule.entity";
import { TimeSlot } from "../entities/Schedule.entity";


export interface IScheduleRepository {
  create(schedule: Omit<Schedule, 'id'>): Promise<Schedule>;
  findById(id: string): Promise<Schedule | null>;
  findByDoctorAndDate(doctorId: string, date: Date): Promise<Schedule | null>;
  findByDoctorId(doctorId: string): Promise<Schedule[]>;
  findByDoctorIdAndDateRange(doctorId: string, startDate: Date, endDate: Date): Promise<Schedule[]>;
  update(id: string, updates: Partial<Schedule>): Promise<Schedule | null>;
  delete(id: string): Promise<boolean>;
  addTimeSlot(scheduleId: string, timeSlot: Omit<TimeSlot, 'id'>): Promise<Schedule | null>;
  deleteTimeSlot(scheduleId: string, timeSlotId: string): Promise<Schedule | null>;
  findAvailableSlots(doctorId: string, date: Date): Promise<TimeSlot[]>;
   updateTimeSlot(
    scheduleId: string, 
    timeSlotId: string, 
    updates: Partial<{
      isBooked: boolean;
      isActive: boolean;
      startTime: string;
      endTime: string;
      patientId: string | null;
    }>
  ): Promise<Schedule | null>;
}