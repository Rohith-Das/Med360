import express from 'express'
import { container } from 'tsyringe'
import { PatientRegistrationUC } from '../../application/patients/usecase/patientRegisterUC'
import { patientRegisterValidator } from '../validators/PatientRegisterValidator'
import { registerPatientController } from '../controllers/patient/patientController'

const PatientRouter=express.Router()

PatientRouter.post('/register',patientRegisterValidator,registerPatientController)


export default PatientRouter;