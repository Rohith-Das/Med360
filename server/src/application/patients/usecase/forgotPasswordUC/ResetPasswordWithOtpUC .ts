import { injectable,inject } from "tsyringe";
import { IPatientRepository } from "../../../../domain/repositories/patientRepository_method";
import { HashService } from "../../../service/HashService";

@injectable()
export class ResetPasswordWithOtpUC {
    constructor(
        @inject('IPatientRepository') private patientRepository: IPatientRepository,
         @inject('HashService') private hashService: HashService
    ){}
    async execute(email:string,otp:string,newPassword:string):Promise<void>{
        if (!email || !otp || !newPassword) {
            throw new Error("Email, OTP and new password are required");
        }
        
        if (typeof newPassword !== 'string') {
            throw new Error("Password must be a string");
        }
        
        if (newPassword.trim().length === 0) {
            throw new Error("Password cannot be empty");
        }
        
        console.log("Attempting to hash password:", typeof newPassword, newPassword);
        const hashPassword = await this.hashService.hash(newPassword.trim());
        await this.patientRepository.resetPasswordWithOtp(email.trim(),otp.toString(),hashPassword)
    }
}