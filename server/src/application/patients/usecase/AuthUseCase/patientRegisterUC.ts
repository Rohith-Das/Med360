import { inject,injectable } from "tsyringe";
import { IPatientRepository } from "../../../../domain/repositories/patientRepository_method";
import { Patient } from "../../../../domain/entities/patient.entity";
import bcrypt from 'bcrypt'
import { EmailService } from "../../../../infrastructure/email/email_service";
import { OTPService } from "../../../../infrastructure/auth/otp_service";


@injectable()
export class PatientRegistrationUC {
    constructor(@inject('IPatientRepository')private patientRepository:IPatientRepository,
@inject(EmailService)private emailService:EmailService,
@inject(OTPService)private otpService:OTPService){}

async execute(patientData:Patient):Promise<Patient>{
    const existingPatientByEmail =await this.patientRepository.findByEmail(patientData.email)
    if (existingPatientByEmail) throw new Error('Email already exists');
    const existingPatientByMobile=await this.patientRepository.findByMobileNumber(patientData.mobile)
        if (existingPatientByMobile) throw new Error('Mobile number already exists');

    const hashedPassword =await bcrypt.hash(patientData.password!,10);
    const otp=this.otpService.generateOTP()
    console.log(`your otp : ${otp}`)
const otpExpirationMinutes = Number(process.env.OTP_EXPIRE_TIME || '600'); 
        const otpExpiresAt = new Date(Date.now() + otpExpirationMinutes * 1000);
        const newPatient: Patient = {
      name: patientData.name,
      mobile: patientData.mobile,
      email: patientData.email,
      password: hashedPassword,
      isVerified: false,
      otp,
      otpExpiresAt,
      role: 'patient',
      isBlocked: false,
  isDeleted: false,
    };
    const registeredPatient = await this.patientRepository.create(newPatient);
     const expirationMinutes = Math.floor(otpExpirationMinutes / 60);
        await this.emailService.sendEmail(
            registeredPatient.email,
            'Verify Your Account',
            `<p>Your OTP for email verification is: <strong>${otp}</strong>. It will expire in ${expirationMinutes} minutes.</p>`
        );
   

    return registeredPatient;
}
}