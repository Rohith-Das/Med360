import express from 'express'
import { DoctorController } from '../controllers/doctorsControllers/doctorController'
import { adminAuthGuard } from '../middlewares/authAdminMiddleware'
import { getDoctorProfileController } from '../controllers/doctorsControllers/DoctorProfileController'
import { doctorAuthGuard } from '../middlewares/DoctorAuthGuard'
const DoctorRouter=express.Router()
const doctorController=new DoctorController()

DoctorRouter.post('/login',doctorController.login)
DoctorRouter.post('/refresh-token', doctorController.refreshToken);
DoctorRouter.get('/all',doctorController.getAllDoctors)
DoctorRouter.put('/:id', adminAuthGuard, doctorController.UpdateDoctor);
DoctorRouter.put('/block/:id', adminAuthGuard, doctorController.BlockDoctor);
DoctorRouter.put('/unblock/:id', adminAuthGuard, doctorController.unblockDoctor);
DoctorRouter.get('/specialization/:specializationId', doctorController.getDoctorsBySpecialization);
DoctorRouter.get('/profile',doctorAuthGuard,getDoctorProfileController)
export default DoctorRouter