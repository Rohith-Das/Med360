import { inject,injectable } from "tsyringe";
import { IPatientRepository } from "../../../domain/repositories/patientRepository_method";
import { OTPService } from "../../../infrastructure/auth/otp_service";
import { EmailService } from "../../../infrastructure/email/email_service";

@injectable()
export class ResendOtpUC{
    constructor(@inject('IPatientRepository')private patientRepo:IPatientRepository,
@inject(OTPService)private otpService:OTPService,
@inject(EmailService)private emailService:EmailService) {}

async execute(email:string):Promise<void>{
    const patient=await this.patientRepo.findByEmail(email)
    if (!patient) throw new Error("Patient not found");
    if (patient.isVerified) throw new Error("Patient is already verified");
    const now = new Date();
    if (patient.otpExpiresAt && now < patient.otpExpiresAt) {
      const secondsLeft = Math.ceil((patient.otpExpiresAt.getTime() - now.getTime()) / 1000);
      throw new Error(`Please wait ${secondsLeft} seconds before resending OTP.`);
    }
    const otp=this.otpService.generateOTP()
    const otpExpiresAt = new Date(now.getTime() + Number(process.env.OTP_EXPIRE_TIME || "120") * 1000);

    await this.patientRepo.update(patient.id!, { otp, otpExpiresAt });

    await this.emailService.sendEmail(
      patient.email,
      "Resend OTP - Verify Your Account",
      `<p>Your new OTP is <strong>${otp}</strong>. It will expire in ${process.env.OTP_EXPIRE_TIME || "120"} seconds.</p>`
    );
  }
}