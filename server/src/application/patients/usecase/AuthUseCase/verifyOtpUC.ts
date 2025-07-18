
import { inject,injectable } from "tsyringe";
import { IPatientRepository } from "../../../../domain/repositories/patientRepository_method";

@injectable()
export class VerifyOtpUC{
    constructor(@inject('IPatientRepository')private patientRepo:IPatientRepository){}
    async execute(email:string,otp:string):Promise<void>{
        const patient=await this.patientRepo.findByEmail(email);
        if (!patient) throw new Error('Patient not found');
        if (!patient.otp || patient.otp !== otp || (patient.otpExpiresAt && new Date() > patient.otpExpiresAt)) {
      throw new Error('Invalid or expired OTP');
    }
        await this.patientRepo.update(patient.id!, { isVerified: true, otp: undefined, otpExpiresAt: undefined });

    }
}