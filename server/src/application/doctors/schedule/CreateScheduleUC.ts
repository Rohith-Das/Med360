import { inject,injectable } from "tsyringe";
import { IScheduleRepository } from "../../../domain/repositories/ScheduleRepository-method";
import { Schedule,TimeSlot } from "../../../domain/entities/Schedule.entity";
import mongoose from "mongoose";

@injectable()
export class CreateScheduleUC {
  constructor(
    @inject('IScheduleRepository') private scheduleRepo: IScheduleRepository
  ) {}

  async execute(doctorId: string, date: Date, timeSlots: Omit<TimeSlot, 'id'>[]): Promise<Schedule|null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scheduleDate = new Date(date);
    scheduleDate.setHours(0, 0, 0, 0);

    if (scheduleDate < today) {
      throw new Error("Cannot create schedule for past dates");
    }

    const existingSchedule = await this.scheduleRepo.findByDoctorAndDate(doctorId, date);
    if (existingSchedule) {
      const updatedSchedule = await this.scheduleRepo.addTimeSlot(existingSchedule.id, timeSlots.map(slot => ({
        ...slot,
        isBooked: false,
      })));
      return updatedSchedule;
    }

    this.validateTimeSlots(timeSlots);
    const schedule = await this.scheduleRepo.create({
      doctorId: new mongoose.Types.ObjectId(doctorId),
      date: scheduleDate,
      timeSlots: timeSlots.map(slot => ({
        ...slot,
        isBooked: false,
      })),
      isActive: true,
    });
    return schedule;
  }

  private validateTimeSlots(timeSlots: Omit<TimeSlot, 'id'>[]): void {
    for (const slot of timeSlots) {
      const startTime = new Date(`2023-01-01 ${slot.startTime}`);
      const endTime = new Date(`2023-01-01 ${slot.endTime}`);
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        throw new Error("Invalid time format. Use HH:MM format");
      }

      const duration = endTime.getTime() - startTime.getTime();
      const thirtyMinutes = 30 * 60 * 1000;
      if (duration !== thirtyMinutes) {
        throw new Error("Each time slot must be 30 minutes");
      }

      if (endTime <= startTime) {
        throw new Error("End time must be after start time");
      }
    }

    const sortedSlots = timeSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
    for (let i = 0; i < sortedSlots.length - 1; i++) {
      if (sortedSlots[i].endTime > sortedSlots[i + 1].startTime) {
        throw new Error('Time slots cannot overlap');
      }
    }
  }
}
@injectable()
export class GetDoctorScheduleUC{
    constructor(
        @inject('IScheduleRepository')private repo:IScheduleRepository
    ){}

    async execute(doctorId:string,startDate?:Date,endDate?:Date):Promise<Schedule[]>{
        if(startDate && endDate){
            return await this.repo.findByDoctorIdAndDateRange(doctorId,startDate,endDate);
        }
        
        return await this.repo.findByDoctorId(doctorId)
    }
}

@injectable()
export class UpdateScheduleUC{
    constructor(
        @inject('IScheduleRepository')private repo:IScheduleRepository
    ){}

    async execute(scheduleId:string,doctorId:string,updates:Partial<Schedule>):Promise<Schedule>{
        const schedule=await this.repo.findById(scheduleId);
        if(!schedule){
            throw new Error("schedule not found")
        }

        if(schedule.doctorId.toString()!==doctorId){
            throw new Error('unauthorized: can not update another doctors schedules')
        }

        if(updates.date){
            const today=new Date();
            today.setHours(0,0,0,0);
            const newDate=new Date(updates.date);
            newDate.setHours(0,0,0,0)

            if(newDate<today){
                throw new Error('can not update schedule to a past date')
            }
        }
        const updated=await this.repo.update(scheduleId,updates)
        if(!updated){
            throw new Error("failed in update Schedule")
        }
        return updated;
    }
}

@injectable()
export class DeleteScheduleUC{
    constructor(
        @inject('IScheduleRepository')private repo:IScheduleRepository
    ){}
    async execute(scheduleId:string,doctorId:string):Promise<boolean>{
        const schedule=await this.repo.findById(scheduleId);
        if(!schedule){
            throw new Error("schedule not found")
        }

        const hasBookedSlots=schedule.timeSlots.some(slot=>slot.isBooked);
        if(hasBookedSlots){
            throw new Error("cannot delete schedule with booked appointment")
        }
        return await this.repo.delete(scheduleId)
    }
}

@injectable()export class ManageTimeSlotUC {
  constructor(
    @inject('IScheduleRepository') private repo: IScheduleRepository
  ) {}

  async addTimeSlot(
    scheduleId: string,
    doctorId: string,
    timeSlot: Omit<TimeSlot, 'id'>
  ): Promise<Schedule> {
    const schedule = await this.repo.findById(scheduleId);
    if (!schedule) {
      throw new Error("Schedule not found");
    }
 
   
    this.validateTimeSlot(timeSlot, schedule.timeSlots);

    const updated = await this.repo.addTimeSlot(scheduleId, {
      ...timeSlot,
      isBooked: false,
      isActive: true,
    });
    if (!updated) {
      throw new Error("Failed to add time slot");
    }
    return updated;
  }

  async updateTimeSlot(
    scheduleId: string,
    timeSlotId: string,
    doctorId: string,
    updates: Partial<TimeSlot>
  ): Promise<Schedule> {
    const schedule = await this.repo.findById(scheduleId);
    if (!schedule) {
      throw new Error("Schedule not found");
    }
const timeSlot = schedule.timeSlots.find(slot => {
      const slotId = slot._id?.toString() || slot.id?.toString();
      return slotId === timeSlotId;
    });
    
    if (!timeSlot) {
      throw new Error("Time slot not found from updatetimeslot");
    }
    if (timeSlot.isBooked) {
      throw new Error("Cannot update a booked time slot");
    }

    const updated = await this.repo.updateTimeSlot(scheduleId, timeSlotId, updates);
    if (!updated) {
      throw new Error("Failed to update time slot");
    }
    return updated;
  }

  async deleteTimeSlot(scheduleId: string, timeSlotId: string, doctorId: string): Promise<Schedule> {
    const schedule = await this.repo.findById(scheduleId);
    if (!schedule) {
      throw new Error('Schedule not found');
    }
    //    console.log('schedule time slot  ',schedule.timeSlots)
    // console.log('doctorid',doctorId);

const timeSlot = schedule.timeSlots.find(
  slot => slot._id.toString() === timeSlotId.toString()
);

    if (!timeSlot) {
      throw new Error('Time slot not found from delete ');
    }

    if (timeSlot.isBooked) {
      throw new Error('Cannot cancel a booked time slot');
    }

    const updated = await this.repo.deleteTimeSlot(scheduleId, timeSlotId);
    if (!updated) {
      throw new Error('Failed to cancel time slot');
    }

    return updated;
  }

  private validateTimeSlot(newSlot: Omit<TimeSlot, 'id'>, existingSlots: TimeSlot[]): void {
    const startTime = new Date(`2023-01-01 ${newSlot.startTime}`);
    const endTime = new Date(`2023-01-01 ${newSlot.endTime}`);
    
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new Error('Invalid time format. Use HH:MM format');
    }

    const duration = endTime.getTime() - startTime.getTime();
    const thirtyMinutes = 30 * 60 * 1000;
    
    if (duration !== thirtyMinutes) {
      throw new Error('Each time slot must be exactly 30 minutes');
    }

    for (const existingSlot of existingSlots.filter(slot => slot.isActive)) {
      const existingStart = new Date(`2023-01-01 ${existingSlot.startTime}`);
      const existingEnd = new Date(`2023-01-01 ${existingSlot.endTime}`);
      
      if (
        (startTime >= existingStart && startTime < existingEnd) ||
        (endTime > existingStart && endTime <= existingEnd) ||
        (startTime <= existingStart && endTime >= existingEnd)
      ) {
        throw new Error('Time slot conflicts with existing slot');
      }
    }
  }
}