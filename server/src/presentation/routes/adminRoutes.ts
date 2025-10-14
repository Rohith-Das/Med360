import express from 'express'
import { adminLoginController } from '../controllers/adminController.ts/adminLoginController'
import { adminRegisterController } from '../controllers/adminController.ts/adminRegisterController'
import { adminRefreshTokenController } from '../controllers/adminController.ts/adminRefreshTokenController'
import { adminAuthGuard } from '../middlewares/authAdminMiddleware'
import { blockPatientController,
  getAllPatientsController,
  getPatientStatsController,
  softDeletedPatientController,
  unblockPatientController
 } from '../controllers/adminController.ts/patientManageMentController'

 import { createSpecialization,updateSpecialization,deleteSpecialization, getSpecializations } from '../controllers/adminController.ts/specializationController'
import { upload } from '../../infrastructure/config/multerConfig'
import { ApplicationController } from '../controllers/ApplicationController/ApplicationController'
import { DashboardController } from '../controllers/DashBoard/DashBoardController'

const AdminRouter=express.Router()
const applicationController = new ApplicationController();
const dashboardController=new DashboardController();

AdminRouter.post("/register",adminRegisterController);

AdminRouter.post("/login",adminLoginController)
AdminRouter.post("/refresh-token",adminRefreshTokenController)

AdminRouter.get('/profile', adminAuthGuard, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome Admin",
    user: (req as any).user,
  });
});

//patient mgt routes
AdminRouter.get('/patients',adminAuthGuard,getAllPatientsController)
AdminRouter.get("/patients/stats",adminAuthGuard,getPatientStatsController);
AdminRouter.put("/patients/:patientId/block",adminAuthGuard,blockPatientController);
AdminRouter.put("/patients/:patientId/unblock",adminAuthGuard,unblockPatientController);
AdminRouter.delete("/patients/:patientId",adminAuthGuard,softDeletedPatientController)

//specialization routes
AdminRouter.post("/specializations", adminAuthGuard, upload.single('image'), createSpecialization);
AdminRouter.put("/specializations/:id", adminAuthGuard, upload.single('image'), updateSpecialization);
AdminRouter.get("/specializations", adminAuthGuard, getSpecializations);
AdminRouter.delete("/specializations/:id", adminAuthGuard, deleteSpecialization);

AdminRouter.get('/applications',adminAuthGuard,applicationController.listApplicationsController)
AdminRouter.get('/applications/:id',adminAuthGuard,applicationController.getApplicationByIdController)
AdminRouter.post('/applications/:id/approve',adminAuthGuard,  applicationController.approveApplicationController);
AdminRouter.post('/applications/:id/reject', adminAuthGuard, applicationController.rejectApplication);
AdminRouter.post('/doctors/create-from-application/:id', adminAuthGuard, upload.single('profileImage'), applicationController.createDoctorFromApplication);

//appointments
AdminRouter.get('/appointments/stats',adminAuthGuard,dashboardController.getAppointmentStats)
AdminRouter.get('/specializations/stats', adminAuthGuard, dashboardController.getSpecializationStats);
export default AdminRouter;