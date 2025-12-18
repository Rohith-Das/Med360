import express from 'express'
import { DoctorController } from '../controllers/doctorsControllers/doctorController'
import { adminAuthGuard } from '../middlewares/authAdminMiddleware'
import { getDoctorProfileController } from '../controllers/doctorsControllers/DoctorProfileController'
import { doctorAuthGuard } from '../middlewares/DoctorAuthGuard'
import { NotificationController } from '../controllers/notification/NotificationController'
import { DoctorAppointmentController } from '../controllers/Appointment/DoctorAppointmentController'
import PrescriptionRouter from './PrescriptionRoutes'

const DoctorRouter=express.Router()
const doctorController=new DoctorController()
const notificationController = new NotificationController();
const doctorAppointmentController = new DoctorAppointmentController();

DoctorRouter.post('/login',doctorController.login)
DoctorRouter.post('/refresh-token', doctorController.refreshToken);
DoctorRouter.get('/all',doctorController.getAllDoctors)
DoctorRouter.put('/:id', adminAuthGuard, doctorController.UpdateDoctor);
DoctorRouter.put('/block/:id', adminAuthGuard, doctorController.BlockDoctor);
DoctorRouter.put('/unblock/:id', adminAuthGuard, doctorController.unblockDoctor);
DoctorRouter.get('/specialization/:specializationId', doctorController.getDoctorsBySpecialization);
DoctorRouter.get('/profile',doctorAuthGuard,getDoctorProfileController)
DoctorRouter.get('/notifications', doctorAuthGuard, notificationController.getNotifications);
DoctorRouter.get('/notifications/unread', doctorAuthGuard, notificationController.getUnreadNotifications);
DoctorRouter.put('/notifications/:notificationId/read', doctorAuthGuard, notificationController.markNotificationAsRead);

DoctorRouter.get(
  '/appointments',
  doctorAuthGuard,
  doctorAppointmentController.getAppointment
);
DoctorRouter.get(
  '/appointments/:appointmentId',
  doctorAuthGuard,
  doctorAppointmentController.getAppointmentByid
);

DoctorRouter.use('/prescriptions', doctorAuthGuard,PrescriptionRouter);

export default DoctorRouter