import express from 'express'
import { patientRegisterValidator } from '../validators/PatientRegisterValidator'
import { registerPatientController } from '../controllers/patient/AuthController/patientController'
import { verifyOtpController } from '../controllers/patient/AuthController/verifyOtpController'
import { resendOtpController } from '../controllers/patient/AuthController/resendOtpController'
import { patientLoginController } from '../controllers/patient/AuthController/patientLoginController'
import { refreshTokenController } from '../controllers/patient/AuthController/refreshTokenController'
import { logoutController } from '../controllers/patient/AuthController/logoutController'
import { resetPasswordWithOtpController } from '../controllers/patient/forgotPassword/resetPasswordWithOtpController '
import { requestPasswordResetOtpController } from '../controllers/patient/forgotPassword/requestPasswordResetOtpController '
import { authGuard } from '../middlewares/AuthMiddleware'
import { getProfileController,updateProfileController } from '../controllers/patient/Profile/profileController'
import { upload } from '../../infrastructure/config/multerConfig'
import { uploadProfilePicture,removeProfilePicture } from '../controllers/patient/Profile/profileController'
import { AppointmentController } from '../controllers/Appointment/AppointmentController'
import { WalletController } from '../controllers/wallet/WalletController'
import { chatbotController } from '../controllers/patient/AIChatbot/chatbotController'
import { NotificationController } from '../controllers/notification/NotificationController'

const PatientRouter=express.Router()
const appointmentController=new AppointmentController()
const walletController = new WalletController()
const notificationController = new NotificationController();

PatientRouter.post('/register', registerPatientController);
PatientRouter.post('/verify-otp', verifyOtpController);
PatientRouter.post('/resend-otp',resendOtpController)


PatientRouter.post('/login',patientLoginController)
PatientRouter.post('/refresh-token',refreshTokenController)
PatientRouter.post('/logout',logoutController)
PatientRouter.post('/request-password-reset-otp', requestPasswordResetOtpController);
PatientRouter.post('/reset-password-with-otp', resetPasswordWithOtpController);
PatientRouter.get("/profile", authGuard, getProfileController);
PatientRouter.put("/profile", authGuard, updateProfileController);
PatientRouter.post("/profile/picture", upload.single('profilePicture'),authGuard, uploadProfilePicture);
PatientRouter.delete("/profile/picture", authGuard,removeProfilePicture);
PatientRouter.get('/appointments',authGuard,appointmentController.getAppointments)
PatientRouter.get('/appointments/:appointmentId', authGuard, appointmentController.getAppointmentById)
PatientRouter.put('/appointments/:appointmentId/cancel', authGuard, appointmentController.cancelAppointment)

PatientRouter.get('/notifications', authGuard, notificationController.getNotifications);
PatientRouter.get('/notifications/unread', authGuard, notificationController.getUnreadNotifications);
PatientRouter.put('/notifications/:notificationId/read', authGuard, notificationController.markNotificationAsRead);

// Wallet routes
PatientRouter.get('/wallet/balance', authGuard, walletController.getWalletBalance)
PatientRouter.get('/wallet/transactions', authGuard, walletController.getTransactionHistory)
PatientRouter.post('/chatbot',authGuard,chatbotController)
export default PatientRouter;