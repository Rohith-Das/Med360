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

import { AdminRegisterUC } from "../../application/admin/usecase/AuthUC/adminRegisterUC";
import { AdminLoginUC } from "../../application/admin/usecase/AuthUC/adminLoginUC";
import { IAdminRepository } from "../../domain/repositories/adminRepository-method";
import { MongoAdminRepository } from "../database/repositores/MongoAdminRepository";
import { AdminRefreshTokenUC } from "../../application/admin/usecase/AuthUC/adminRefreshTokenUC";

import { RequestPasswordResetOtpUC } from "../../application/patients/usecase/forgotPasswordUC/RequestPasswordResetOtpUC ";
import { ResetPasswordWithOtpUC } from "../../application/patients/usecase/forgotPasswordUC/ResetPasswordWithOtpUC ";

//admin patient management usecase

import { GetAllPtientsUC } from "../../application/admin/usecase/patientMGT-UC.ts/getAllPatientsUC";
import { blockPatientUC } from "../../application/admin/usecase/patientMGT-UC.ts/blockPatientUC";
import { unblockPatientUC } from "../../application/admin/usecase/patientMGT-UC.ts/unblockPatientUC";
import { SoftDeletePatientUC } from "../../application/admin/usecase/patientMGT-UC.ts/SoftDeletePatientUC ";
import { getPatientStats } from "../../application/admin/usecase/patientMGT-UC.ts/getPatientStatsUC";
import { PatientProfileUseCase } from "../../application/patients/usecase/profile/profileUseCase";
import { ISpecializationRepository } from "../../domain/repositories/specializationRepository-method";
import { MongoSpecializationRepository } from "../database/repositores/MongoSpecializationRepository";
import {  CreateSpecializationUC } from "../../application/admin/usecase/specialization/createSpecializationUC";
import { updateSpecializationUC } from "../../application/admin/usecase/specialization/updateSpecializationUC";
import { getSpecializationsUC } from "../../application/admin/usecase/specialization/getSpecializationsUC";
import { DeleteSpecializationUC } from "../../application/admin/usecase/specialization/deleteSpecializationUC";
import { CloudinaryService } from "../services/CloudinaryService";

import { IApplicantRepository } from "../../domain/repositories/applicantRepository-method";
import { MongoApplicantRepository } from "../database/repositores/MongoApplicantRepository";
import { SubmitApplicationUC } from "../../application/ApplicantUC/SubmitApplicationUC";
import { ListApplicationUC } from "../../application/ApplicantUC/ListApplicationUC";
import { GetApplicationByIdUC } from "../../application/ApplicantUC/GetApplicationBtIdUC";
import { ApproveApplicationUC } from "../../application/ApplicantUC/ApproveApplicationUC";
import { RejectApplicationUC } from "../../application/ApplicantUC/RejectApplicationUC";
import { IDoctorRepository } from "../../domain/repositories/DoctorRepository-method";
import { MongoDoctorRepository } from "../database/repositores/MongoDoctorRepository";
import { CreateDoctorFromApplicationUC } from "../../application/doctors/CreateDoctorFromApplicationUC";

import { DoctorLoginUC } from "../../application/doctors/AuthUC/DoctorLoginUC";
import { doctorRefereshTokenUc } from "../../application/doctors/AuthUC/DoctorRefreshTokenUC";
import { GetAllDoctorUC } from "../../application/doctors/GetAllDoctorUC";
import { UnBlockDoctorUC } from "../../application/doctors/UnblockDoctorUC";
import { BlockDoctorUC } from "../../application/doctors/BlockDoctorsUC";
import { UpdateDoctorUC } from "../../application/doctors/UpdateDoctorUC";
import { IScheduleRepository } from "../../domain/repositories/ScheduleRepository-method";
import { MongoScheduleRepository } from "../database/repositores/MongoScheduleRepo";
import { CreateScheduleUC, DeleteScheduleUC, GetDoctorScheduleUC, ManageTimeSlotUC, UpdateScheduleUC } from "../../application/doctors/schedule/CreateScheduleUC";
import { DoctorProfileUC } from "../../application/doctors/DoctorProfileUC";
import { PaymentService } from "../../application/service/PaymentService";
import { StripePaymentService } from "../services/StripePaymentService";
import { MongoPaymentRepository } from "../database/repositores/MongoPaymentRepo";
import { MongoAppointmentRepo } from "../database/repositores/MongoAppointmentRepo";
import { IPaymentRepository } from "../../domain/repositories/Paymentrepository";
import { IAppointmentRepository } from "../../domain/repositories/AppointmentRepository";
import { CreatePaymentUC } from "../../application/payment/CreatePaymentUC";
import { ConfirmPaymentUC } from "../../application/payment/ConfirmPaymentUC";
import { CreateAppointmentUC } from "../../application/Appointment/CreateAppointmentUC";
import { GetAppointmentUC } from "../../application/Appointment/GetAppointment";
import { IWalletRepository } from "../../domain/repositories/WalletRepository";
import { MongoWalletRepo } from "../database/repositores/MongoWalletRepo";
import { CancelAppointmentUC } from "../../application/Appointment/CancelAppointmentUC";
import { WalletPaymentUC } from "../../application/payment/WalletPaymentUC";
import { GetTransactionHistoryUC, GetWalletBalanceUC } from "../../application/payment/GetWalletBalanceUC";
import { INotificationRepository } from "../../domain/repositories/NotificationRepository";
import { MongoNotificationRepository } from "../database/repositores/MongoNotificationRepository";
import { CreateNotificationUC } from "../../application/notification/CreateNotificationUC";
import { MarkAllNotificationsReadUC } from "../../application/notification/MarkAllNotificationsReadUC";
import { MarkNotificationReadUC } from "../../application/notification/MarkNotificationReadUC";
import { NotificationService } from "../../application/notification/NotificationService";
import { GetNotificationsUC } from "../../application/notification/GetNotificationsUC";
import { AIService } from "../../application/service/AIService";
import { GeminiService } from "../services/GeminiService";
import { ChatBotUC } from "../../application/ai/chatbotUseCase";
import { VideoCallUseCase } from "../../application/videoCall/VideoCallUC";
import { GetDoctorAppointmentUC } from "../../application/Appointment/GetDoctorsAppointmentUC";
import { MongoDashboardRepo } from "../database/repositores/MongoDashboardRepo";
import { IDashboardRepository } from "../../domain/repositories/DashboardRepository";
import { DashBoardUC } from "../../application/DashBoard/DashboardUC";
import { IChatRepository } from "../../domain/repositories/ChatRepository";
import { MongoChatRepository } from "../database/repositores/MongoChatRepository";
import { FindOrCreateChatRoomUC } from "../../application/Chats/FindOrCreateChatRoomUC";
import { SearchUsersUC } from "../../application/Chats/SearchUsersUC";

// Database
container.registerSingleton(mongoDBClient);

// Repositories
container.register<IPatientRepository>('IPatientRepository', MongoPatientRepository); // Only once
container.register<IAdminRepository>("IAdminRepository", MongoAdminRepository);
container.register<ISpecializationRepository>("ISpecializationRepository",MongoSpecializationRepository);
container.register<IApplicantRepository>("IApplicantRepository",MongoApplicantRepository)
container.register<IDoctorRepository>("IDoctorRepository", MongoDoctorRepository);
container.register<IScheduleRepository>('IScheduleRepository',MongoScheduleRepository)
container.register<IPaymentRepository>('IPaymentRepository', MongoPaymentRepository);
container.register<IAppointmentRepository>('IAppointmentRepository', MongoAppointmentRepo);
container.register<IWalletRepository>('IWalletRepository', MongoWalletRepo);
container.register<INotificationRepository>('INotificationRepository', MongoNotificationRepository);
// Services
container.registerSingleton(EmailService);
container.registerSingleton(OTPService);
container.register<AIService>("AIService",{useClass:GeminiService})
container.register<AuthService>("AuthService", { useClass: JwtAuthService });
container.register<HashService>("HashService", { useClass: BcryptHashService });
// Use Cases
container.registerSingleton(PatientRegistrationUC);
container.registerSingleton(RequestPasswordResetOtpUC);
container.registerSingleton(ResetPasswordWithOtpUC);
//admin use cases
container.registerSingleton(AdminRegisterUC);
container.registerSingleton(AdminLoginUC);
container.registerSingleton(AdminRefreshTokenUC)

//admin patient management usecases
container.registerSingleton(GetAllPtientsUC);
container.registerSingleton(blockPatientUC)
container.registerSingleton(unblockPatientUC);
container.registerSingleton(SoftDeletePatientUC);
container.registerSingleton(getPatientStats)
container.registerSingleton(PatientProfileUseCase)

//specialization usecase
container.registerSingleton("CloudinaryService", CloudinaryService);
container.registerSingleton(CreateSpecializationUC)
container.registerSingleton(updateSpecializationUC)
container.registerSingleton(getSpecializationsUC)
container.registerSingleton(DeleteSpecializationUC)

//Applicant usecase
container.registerSingleton(SubmitApplicationUC)
container.registerSingleton(ListApplicationUC)
container.registerSingleton(GetApplicationByIdUC)
container.registerSingleton(ApproveApplicationUC)
container.registerSingleton(RejectApplicationUC)
container.registerSingleton(CreateDoctorFromApplicationUC);
container.registerSingleton(DoctorLoginUC);
container.registerSingleton(doctorRefereshTokenUc);
container.registerSingleton(GetAllDoctorUC)
container.registerSingleton(UnBlockDoctorUC)
container.registerSingleton(BlockDoctorUC)
container.registerSingleton(UpdateDoctorUC)

container.registerSingleton(CreateScheduleUC)
container.registerSingleton(GetDoctorScheduleUC)
container.registerSingleton(UpdateScheduleUC)
container.registerSingleton(DeleteScheduleUC)
container.registerSingleton(ManageTimeSlotUC)

container.registerSingleton(DoctorProfileUC)

// Payment service
container.register<PaymentService>('PaymentService', StripePaymentService);

// Payment use cases
container.registerSingleton(CreatePaymentUC);
container.registerSingleton(ConfirmPaymentUC);
container.registerSingleton(CreateAppointmentUC);
container.registerSingleton(GetAppointmentUC)
container.registerSingleton(CancelAppointmentUC);
container.registerSingleton(WalletPaymentUC);
container.registerSingleton(GetWalletBalanceUC);
container.registerSingleton(GetTransactionHistoryUC);
container.registerSingleton(GetDoctorAppointmentUC)

container.registerSingleton(CreateNotificationUC);
container.registerSingleton(GetNotificationsUC);
container.registerSingleton(MarkNotificationReadUC);
container.registerSingleton(MarkAllNotificationsReadUC);
container.registerSingleton(NotificationService);
container.registerSingleton(ChatBotUC);

/// dashboard

container.register<IDashboardRepository>('IDashboardRepository',{
    useClass:MongoDashboardRepo
})
container.registerSingleton(DashBoardUC)

container.register<IChatRepository>("IChatRepository", {
  useClass: MongoChatRepository,
});
container.registerSingleton(FindOrCreateChatRoomUC);
container.registerSingleton(SearchUsersUC);
export {container}