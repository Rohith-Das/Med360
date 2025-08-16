import { Request, Response } from "express";
import { container } from "tsyringe";
import { CreateScheduleUC } from "../../../application/doctors/schedule/CreateScheduleUC";
import { GetDoctorScheduleUC } from "../../../application/doctors/schedule/CreateScheduleUC";
import { UpdateScheduleUC } from "../../../application/doctors/schedule/CreateScheduleUC";
import { DeleteScheduleUC } from "../../../application/doctors/schedule/CreateScheduleUC";
import { ManageTimeSlotUC } from "../../../application/doctors/schedule/CreateScheduleUC";
import { AuthRequest } from "../../middlewares/AuthRequest";

export class ScheduleController {
  async createSchedule(req: AuthRequest, res: Response): Promise<Response> {
    try {
      console.log('Request body:', req.body);
      const { date, timeSlots } = req.body;
      const doctorId = (req as any).user.userId;
      console.log(doctorId);

      if (!date || !timeSlots || !Array.isArray(timeSlots)) {
        return res.status(400).json({
          success: false,
          message: 'Date and timeSlots are required',
        });
      }

      const useCase = container.resolve(CreateScheduleUC);
      const schedule = await useCase.execute(doctorId, new Date(date), timeSlots);

      return res.status(201).json({
        success: true,
        message: 'Schedule created successfully',
        data: schedule,
      });
    } catch (error: any) {
      console.error('Create schedule error:', error.message);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to create schedule',
      });
    }
  }

  async getSchedules(req: Request, res: Response): Promise<Response> {
    try {
      const doctorId = (req as any).user.userId;
      const { startDate, endDate } = req.query;

      const useCase = container.resolve(GetDoctorScheduleUC);
      const schedules = await useCase.execute(
        doctorId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      return res.status(200).json({
        success: true,
        message: 'Schedules retrieved successfully',
        data: schedules,
      });
    } catch (error: any) {
      console.error('Get schedules error:', error.message);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve schedules',
      });
    }
  }

  async getSchedulesByDoctorId(req: Request, res: Response): Promise<Response> {
    try {
      const { doctorId } = req.params;
      const { startDate, endDate } = req.query;

      const useCase = container.resolve(GetDoctorScheduleUC);
      const schedules = await useCase.execute(
        doctorId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      return res.status(200).json({
        success: true,
        message: 'Schedules retrieved successfully',
        data: schedules,
      });
    } catch (error: any) {
      console.error('Get schedules by doctorId error:', error.message);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve schedules',
      });
    }
  }

  async updateSchedule(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const doctorId = (req as any).user.userId;
      const updates = req.body;

      const useCase = container.resolve(UpdateScheduleUC);
      const schedule = await useCase.execute(id, doctorId, updates);

      return res.status(200).json({
        success: true,
        message: 'Schedule updated successfully',
        data: schedule,
      });
    } catch (error: any) {
      console.error('Update schedule error:', error.message);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to update schedule',
      });
    }
  }

  async deleteSchedule(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const doctorId = (req as any).user.userId;

      const useCase = container.resolve(DeleteScheduleUC);
      await useCase.execute(id, doctorId);

      return res.status(200).json({
        success: true,
        message: 'Schedule deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete schedule error:', error.message);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete schedule',
      });
    }
  }

  async addTimeSlot(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const doctorId = (req as any).user.userId;
      const { startTime, endTime } = req.body;

      if (!startTime || !endTime) {
        return res.status(400).json({
          success: false,
          message: 'Start time and end time are required',
        });
      }

      const useCase = container.resolve(ManageTimeSlotUC);
      const schedule = await useCase.addTimeSlot(id, doctorId, {
        startTime,
        endTime,
        isBooked: false,
         isActive: true,
      });

      return res.status(200).json({
        success: true,
        message: 'Time slot added successfully',
        data: schedule,
      });
    } catch (error: any) {
      console.error('Add time slot error:', error.message);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to add time slot',
      });
    }
  }

  async updateTimeSlot(req: Request, res: Response): Promise<Response> {
    try {
      const { scheduleId, timeSlotId } = req.params;
      const doctorId = (req as any).user.userId;
      const updates = req.body;

      const useCase = container.resolve(ManageTimeSlotUC);
      const schedule = await useCase.updateTimeSlot(scheduleId, timeSlotId, doctorId, updates);

      return res.status(200).json({
        success: true,
        message: 'Time slot updated successfully',
        data: schedule,
      });
    } catch (error: any) {
      console.error('Update time slot error:', error.message);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to update time slot',
      });
    }
  }

  async deleteTimeSlot(req: Request, res: Response): Promise<Response> {
    try {
      const { scheduleId, timeSlotId } = req.params;
      const doctorId = (req as any).user.userId;

      const useCase = container.resolve(ManageTimeSlotUC);
      const schedule = await useCase.deleteTimeSlot(scheduleId, timeSlotId, doctorId);

      return res.status(200).json({
        success: true,
        message: 'Time slot deleted successfully',
        data: schedule,
      });
    } catch (error: any) {
      console.error('Delete time slot error:', error.message);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete time slot',
      });
    }
  }

  async cancelTimeSlot(req: Request, res: Response): Promise<Response> {
    try {
      const { scheduleId, timeSlotId } = req.params;
      const doctorId = (req as any).user.userId;
    console.log('Cancel request params:', { scheduleId, timeSlotId, doctorId });
  if (!scheduleId || !timeSlotId) {
      return res.status(400).json({
        success: false,
        message: 'Schedule ID and Time Slot ID are required',
      });
    }
      const useCase = container.resolve(ManageTimeSlotUC);
      const schedule = await useCase.deleteTimeSlot(scheduleId, timeSlotId, doctorId); // Reuses deleteTimeSlot for soft delete

      return res.status(200).json({
        success: true,
        message: 'Time slot canceled successfully',
        data: schedule,
      });
    } catch (error: any) {
      console.error('Cancel time slot error:', error.message);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to cancel time slot',
      });
    }
  }

  async getAvailableSlots(req: Request, res: Response): Promise<Response> {
    try {
      const { doctorId } = req.params;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'Date is required',
        });
      }

      const useCase = container.resolve(GetDoctorScheduleUC);
      const schedules = await useCase.execute(doctorId, new Date(date as string), new Date(date as string));
      
      const schedule = schedules[0];
      const availableSlots = schedule ? schedule.timeSlots.filter(slot => !slot.isBooked && slot.isActive) : [];

      return res.status(200).json({
        success: true,
        message: 'Available slots retrieved successfully',
        data: availableSlots,
      });
    } catch (error: any) {
      console.error('Get available slots error:', error.message);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve available slots',
      });
    }
  }
}