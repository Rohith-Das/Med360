import express from 'express'
import { patientRegisterValidator } from '../validators/PatientRegisterValidator'
import { registerPatientController } from '../controllers/patient/patientController'
import { verifyOtpController } from '../controllers/patient/verifyOtpController'
import { resendOtpController } from '../controllers/patient/resendOtpController'
import { patientLoginController } from '../controllers/patient/patientLoginController'
import { refreshTokenController } from '../controllers/patient/refreshTokenController'
import { logoutController } from '../controllers/patient/logoutController'
import { authGuard } from '../middlewares/AuthMiddleware'

const PatientRouter=express.Router()

PatientRouter.post('/register', registerPatientController);
PatientRouter.post('/verify-otp', verifyOtpController);
PatientRouter.post('/resend-otp',resendOtpController)


PatientRouter.post('/login',patientLoginController)
PatientRouter.post('/refresh-token',refreshTokenController)
PatientRouter.post('/logout',logoutController)
PatientRouter.get('/profile', authGuard, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome patient",
    user: (req as any).user,
  });
});

export default PatientRouter;