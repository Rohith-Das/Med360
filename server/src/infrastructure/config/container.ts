import { container, injectable } from "tsyringe";
import {IPatientRepository} from '../../domain/repositories/patientRepository_method'
import { MongoPatientRepository } from "../database/repositores/MongoPatientRepository";
import { mongoDBClient } from "../database/mongoDB/mongoDBClient";
import { EmailService } from "../email/email_service";
import { OTPService } from "../auth/otp_service";
import { PatientRegistrationUC } from "../../application/patients/usecase/patientRegisterUC";
import { BcryptHashService } from "../services/BcryptHashService";
import { JwtAuthService } from "../services/jwtAuthService";
import { HashService } from "../../application/service/HashService";
import { AuthService } from "../../application/service/AuthService";


//db
container.registerSingleton(mongoDBClient)
//Repo
container.register<IPatientRepository>('IPatientRepository',MongoPatientRepository)
// services
container.registerSingleton(EmailService);
container.registerSingleton(OTPService);
container.register<AuthService>("AuthService",{useClass:JwtAuthService})
container.register<HashService>("HashService", { useClass: BcryptHashService });
// usecases
container.registerSingleton(PatientRegistrationUC);

