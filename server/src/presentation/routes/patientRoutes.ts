import express from 'express'
import { patientRegisterValidator } from '../validators/PatientRegisterValidator'
import { registerPatientController } from '../controllers/patient/patientController'

const PatientRouter=express.Router()

PatientRouter.post('/register', patientRegisterValidator, registerPatientController);
console.log("✅ Loaded patientRoutes");


export default PatientRouter;