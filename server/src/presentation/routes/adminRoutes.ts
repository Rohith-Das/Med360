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
const AdminRouter=express.Router()

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
AdminRouter.put("/patients/patientId/unblock",adminAuthGuard,unblockPatientController);
AdminRouter.delete("/patients/:patientId",adminAuthGuard,softDeletedPatientController)

export default AdminRouter;