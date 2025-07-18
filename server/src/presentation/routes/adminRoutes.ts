import express from 'express'
import { adminLoginController } from '../controllers/adminController.ts/adminLoginController'
import { adminRegisterController } from '../controllers/adminController.ts/adminRegisterController'
import { adminRefreshTokenController } from '../controllers/adminController.ts/adminRefreshTokenController'
import { adminAuthGuard } from '../middlewares/authAdminMiddleware'

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

export default AdminRouter;