import { inject, injectable } from "tsyringe";
import { IPatientRepository } from "../../../../domain/repositories/patientRepository_method";
import { OTPService } from "../../../../infrastructure/auth/otp_service";
import { EmailService } from "../../../../infrastructure/email/email_service";

@injectable()
export class RequestPasswordResetOtpUC {
    constructor(
       @inject('IPatientRepository') private patientRepository: IPatientRepository,
        @inject(OTPService) private otpService: OTPService,
        @inject(EmailService) private emailService: EmailService
    ){}
    
    async execute(email: string): Promise<void> {
        // First, check if patient exists
        const existingPatient = await this.patientRepository.findByEmail(email);
        if (!existingPatient) {
            throw new Error("No account found with this email address");
        }

        const otp = this.otpService.generateOTP();
        const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        
        console.log(`📧 OTP for ${email}: ${otp}`);
        
        // Store OTP without hashing it
        await this.patientRepository.requestPasswordRest(email, otp, otpExpiresAt);

        const html = `
            <h2>Password Reset OTP</h2>
            <p>Your OTP for password reset is: <strong>${otp}</strong></p>
            <p>This OTP will expire in 15 minutes.</p>
        `;
        
        await this.emailService.sendEmail(email, "Password Reset OTP", html);
    }
}