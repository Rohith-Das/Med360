import { container, injectable } from "tsyringe";
import {IPatientRepository} from '../../domain/repositories/patientRepository_method'
import { MongoPatientRepository } from "../database/repositores/MongoPatientRepository";
import { mongoDBClient } from "../database/mongoDB/mongoDBClient";
import { EmailService } from "../email/email_service";
import { OTPService } from "../auth/otp_service";
import { PatientRegistrationUC } from "../../application/patients/usecase/AuthUseCase/patientRegisterUC";
import { BcryptHashService } from "../services/BcryptHashService";
import { JwtAuthService } from "../services/jwtAuthService";
import { HashService } from "../../application/service/HashService";
import { AuthService } from "../../application/service/AuthService";

import { AdminRegisterUC } from "../../application/admin/usecase/adminRegisterUC";
import { AdminLoginUC } from "../../application/admin/usecase/adminLoginUC";
import { IAdminRepository } from "../../domain/repositories/adminRepository-method";
import { MongoAdminRepository } from "../database/repositores/MongoAdminRepository";

import { RequestPasswordResetOtpUC } from "../../application/patients/usecase/forgotPasswordUC/RequestPasswordResetOtpUC ";
import { ResetPasswordWithOtpUC } from "../../application/patients/usecase/forgotPasswordUC/ResetPasswordWithOtpUC ";

// Database
container.registerSingleton(mongoDBClient);

// Repositories
container.register<IPatientRepository>('IPatientRepository', MongoPatientRepository); // Only once
container.register<IAdminRepository>("IAdminRepository", MongoAdminRepository);

// Services
container.registerSingleton(EmailService);
container.registerSingleton(OTPService);
container.register<AuthService>("AuthService", { useClass: JwtAuthService });
container.register<HashService>("HashService", { useClass: BcryptHashService });

// Use Cases
container.registerSingleton(PatientRegistrationUC);
container.registerSingleton(AdminRegisterUC);
container.registerSingleton(AdminLoginUC);
container.registerSingleton(RequestPasswordResetOtpUC);
container.registerSingleton(ResetPasswordWithOtpUC);