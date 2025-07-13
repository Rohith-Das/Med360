import express from 'express'
import { patientRegisterValidator } from '../validators/PatientRegisterValidator'
import { registerPatientController } from '../controllers/patient/patientController'
import { verifyOtpController } from '../controllers/patient/verifyOtpController'
import { resendOtpController } from '../controllers/patient/resendOtpController'
import { patientLoginController } from '../controllers/patient/patientLoginController'
import { patientLoginValidator } from '../validators/patientLoginValidator'
import { refreshTokenController } from '../controllers/patient/refreshTokenController'

const PatientRouter=express.Router()

PatientRouter.post('/register', patientRegisterValidator, registerPatientController);
PatientRouter.post('/verify-otp', verifyOtpController);
PatientRouter.post('/resend-otp',resendOtpController)

PatientRouter.post('/login',patientLoginValidator,patientLoginController)
PatientRouter.post('/refresh-token',refreshTokenController)


export default PatientRouter;