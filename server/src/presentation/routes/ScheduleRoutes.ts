import express from 'express';
import { ScheduleController } from '../controllers/doctorsControllers/scheduleController';
import { doctorAuthGuard } from '../middlewares/DoctorAuthGuard';

const ScheduleRouter = express.Router();
const scheduleController = new ScheduleController();

// Doctor schedule management routes (protected by doctor auth)
ScheduleRouter.post('/', doctorAuthGuard, scheduleController.createSchedule);
ScheduleRouter.get('/', doctorAuthGuard, scheduleController.getSchedules); // Keep for auth-based
ScheduleRouter.get('/doctor/:doctorId', scheduleController.getSchedulesByDoctorId); // New route for query
ScheduleRouter.put('/:id', doctorAuthGuard, scheduleController.updateSchedule);
ScheduleRouter.delete('/:id', doctorAuthGuard, scheduleController.deleteSchedule);

// Time slot management routes
ScheduleRouter.post('/:id/timeslots', doctorAuthGuard, scheduleController.addTimeSlot);
ScheduleRouter.put('/:scheduleId/timeslots/:timeSlotId', doctorAuthGuard, scheduleController.updateTimeSlot);
ScheduleRouter.delete('/:scheduleId/timeslots/:timeSlotId', doctorAuthGuard, scheduleController.deleteTimeSlot);
ScheduleRouter.patch('/:scheduleId/time-slots/:timeSlotId/cancel', doctorAuthGuard, scheduleController.cancelTimeSlot);

// Public route for patients to view available slots
ScheduleRouter.get('/doctor/:doctorId/available-slots', scheduleController.getAvailableSlots);

export default ScheduleRouter;