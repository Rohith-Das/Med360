import { injectable } from 'tsyringe';
import { IScheduleRepository } from '../../../domain/repositories/ScheduleRepository-method';
import { Schedule, TimeSlot } from '../../../domain/entities/Schedule.entity';
import { ScheduleModel } from '../models/ScheduleModel';
import mongoose from 'mongoose';

@injectable()
export class MongoScheduleRepository implements IScheduleRepository {
  async create(schedule: Omit<Schedule, 'id'>): Promise<Schedule> {
    const newSchedule = new ScheduleModel(schedule);
    const saved = await newSchedule.save();
    return {
      id: saved._id.toString(),
      ...saved.toObject(),
    };
  }

  // async findById(id: string): Promise<Schedule | null> {
  //   const schedule = await ScheduleModel.findById(id).populate('doctorId');
  //   if (!schedule) return null;
  //   return {
  //     id: schedule._id.toString(),
  //     ...schedule.toObject(),
  //   };
  // }
  async findById(id: string): Promise<Schedule | null> {
    try {
      const schedule = await ScheduleModel.findById(id)
        .populate("doctorId", "name specialization profileImage")
        .populate("timeSlots");
      if (!schedule) return null;
      return {
        id: schedule._id.toString(),
        ...schedule.toObject(),
      };
    } catch (error) {
      console.error(`Error in findById(${id}):`, error);
      return null;
    }
  }

  async findByDoctorAndDate(doctorId: string, date: Date): Promise<Schedule | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const schedule = await ScheduleModel.findOne({
      doctorId: new mongoose.Types.ObjectId(doctorId),
      date: { $gte: startOfDay, $lte: endOfDay },
      isActive: true,
    });

    if (!schedule) return null;
    return {
      id: schedule._id.toString(),
      ...schedule.toObject(),
    };
  }

  async findByDoctorId(doctorId: string): Promise<Schedule[]> {
    const schedules = await ScheduleModel.find({
      doctorId: new mongoose.Types.ObjectId(doctorId),
      isActive: true,
    }).sort({ date: 1 });

    return schedules.map((schedule) => ({
      id: schedule._id.toString(),
      ...schedule.toObject(),
    }));
  }

  async findByDoctorIdAndDateRange(doctorId: string, startDate: Date, endDate: Date): Promise<Schedule[]> {
    const schedules = await ScheduleModel.find({
      doctorId: new mongoose.Types.ObjectId(doctorId),
      date: { $gte: startDate, $lte: endDate },
      isActive: true,
    }).sort({ date: 1 });

    return schedules.map((schedule) => ({
      id: schedule._id.toString(),
      ...schedule.toObject(),
    }));
  }

  async update(id: string, updates: Partial<Schedule>): Promise<Schedule | null> {
    const updated = await ScheduleModel.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) return null;
    return {
      id: updated._id.toString(),
      ...updated.toObject(),
    };
  }

  async delete(id: string): Promise<boolean> {
    const result = await ScheduleModel.findByIdAndDelete(id);
    return !!result;
  }

  async addTimeSlot(scheduleId: string, timeSlot: Omit<TimeSlot, 'id'>): Promise<Schedule | null> {
    const updated = await ScheduleModel.findByIdAndUpdate(
      scheduleId,
      { $push: { timeSlots: timeSlot } },
      { new: true }
    );
    if (!updated) return null;
    return {
      id: updated._id.toString(),
      ...updated.toObject(),
    };
  }

  // async updateTimeSlot(scheduleId: string, timeSlotId: string, updates: Partial<TimeSlot>): Promise<Schedule | null> {
  //   const updated = await ScheduleModel.findOneAndUpdate(
  //     { _id: scheduleId, 'timeSlots._id': timeSlotId },
  //     { $set: Object.keys(updates).reduce((acc, key) => {
  //         acc[`timeSlots.$.${key}`] = updates[key as keyof TimeSlot];
  //         return acc;
  //       }, {} as any) },
  //     { new: true }
  //   );
  //   if (!updated) return null;
  //   return {
  //     id: updated._id.toString(),
  //     ...updated.toObject(),
  //   };
  // }
    async updateTimeSlot(
    scheduleId: string, 
    timeSlotId: string, 
    updates: Partial<{
      isBooked: boolean;
      isActive: boolean;
      startTime: string;
      endTime: string;
      patientId: string | null;
    }>
  ): Promise<Schedule | null> {
    try {
      const updateObject: any = {};
      
      // Build the update object for nested fields
      Object.keys(updates).forEach(key => {
        updateObject[`timeSlots.$.${key}`] = updates[key as keyof typeof updates];
      });

      // If patientId is being set, convert to ObjectId
      if (updates.patientId) {
        updateObject['timeSlots.$.patientId'] = new mongoose.Types.ObjectId(updates.patientId);
      }

      const updatedSchedule = await ScheduleModel.findOneAndUpdate(
        { 
          _id: scheduleId, 
          'timeSlots._id': timeSlotId 
        },
        { $set: updateObject },
        { 
          new: true,
          runValidators: true 
        }
      ).populate('timeSlots.patientId', 'name email');

      return updatedSchedule;
    } catch (error: any) {
      console.error('Update time slot error:', error);
      throw new Error(`Failed to update time slot: ${error.message}`);
    }
  }

  async deleteTimeSlot(scheduleId: string, timeSlotId: string): Promise<Schedule | null> {
    const updated = await ScheduleModel.findOneAndUpdate(
      { _id: scheduleId, 'timeSlots._id': timeSlotId },
      { $set: { 'timeSlots.$.isActive': false } },
      { new: true }
    );
    if (!updated) return null;
    return {
      id: updated._id.toString(),
      ...updated.toObject(),
    };
  }

  async findAvailableSlots(doctorId: string, date: Date): Promise<TimeSlot[]> {
    const schedule = await this.findByDoctorAndDate(doctorId, date);
    if (!schedule) return [];
    return schedule.timeSlots.filter(slot => !slot.isBooked && slot.isActive);
  }
}