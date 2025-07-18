import express from 'express'
import { patientRegisterValidator } from '../validators/PatientRegisterValidator'
import { registerPatientController } from '../controllers/patient/AuthController/patientController'
import { verifyOtpController } from '../controllers/patient/AuthController/verifyOtpController'
import { resendOtpController } from '../controllers/patient/AuthController/resendOtpController'
import { patientLoginController } from '../controllers/patient/AuthController/patientLoginController'
import { refreshTokenController } from '../controllers/patient/AuthController/refreshTokenController'
import { logoutController } from '../controllers/patient/AuthController/logoutController'
import { authGuard } from '../middlewares/AuthMiddleware'
import { resetPasswordWithOtpController } from '../controllers/patient/forgotPassword/resetPasswordWithOtpController '
import { requestPasswordResetOtpController } from '../controllers/patient/forgotPassword/requestPasswordResetOtpController '




const PatientRouter=express.Router()

PatientRouter.post('/register', registerPatientController);
PatientRouter.post('/verify-otp', verifyOtpController);
PatientRouter.post('/resend-otp',resendOtpController)


PatientRouter.post('/login',patientLoginController)
PatientRouter.post('/refresh-token',refreshTokenController)
PatientRouter.post('/logout',logoutController)
PatientRouter.post('/request-password-reset-otp', requestPasswordResetOtpController);
PatientRouter.post('/reset-password-with-otp', resetPasswordWithOtpController);
PatientRouter.get('/profile', authGuard, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome patient",
    user: (req as any).user,
  });
});

export default PatientRouter;