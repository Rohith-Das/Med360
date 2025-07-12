import { container, injectable } from "tsyringe";
import {IPatientRepository} from '../../domain/repositories/patientRepository_method'
import { MongoPatientRepository } from "../database/repositores/MongoPatientRepository";
import { mongoDBClient } from "../database/mongoDB/mongoDBClient";
import { EmailService } from "../email/email_service";
import { OTPService } from "../auth/otp_service";
import { PatientRegistrationUC } from "../../application/patients/usecase/patientRegisterUC";

//db
container.registerSingleton(mongoDBClient)
//Repo
container.register<IPatientRepository>('IPatientRepository',MongoPatientRepository)
// services
container.registerSingleton(EmailService);
container.registerSingleton(OTPService);

// usecases
container.registerSingleton(PatientRegistrationUC);
