import { injectable,inject } from "tsyringe";
import { IDoctorRepository } from "../../../domain/repositories/DoctorRepository-method";
import { JwtAuthService } from "../../../infrastructure/services/jwtAuthService";
import { HashService } from "../../service/HashService";
import { Doctor } from "../../../domain/entities/Doctor.entity";
import { AuthService } from "../../service/AuthService";
import { Doc } from "zod/v4/core/doc.cjs";
import { TokenPayload } from "../../../shared/AuthType";
@injectable()
export class DoctorLoginUC{
    constructor(
        @inject('IDoctorRepository') private doctorRepo:IDoctorRepository,
        @inject('HashService')private hashService:HashService,
        @inject("AuthService")private authService:AuthService
    ){}

    async execute({email,password}:{email:string;password:string}):Promise<{
        doctorAccessToken:string;doctorRefereshToken:string;doctor:Doctor
    }>{
        const doctor=await this.doctorRepo.findByEmail(email);
        if(!doctor || !doctor.password){
          throw new Error("Invalid credentials");
        }
        const isMatch=await this.hashService.compare(password,doctor.password)
         if (!isMatch) {
      throw new Error("Invalid credentials");
    }

    if (doctor.isBlocked) {
      throw new Error("Your account is blocked");
    }

    if (doctor.status !== 'approved') {
      throw new Error("Your account is not approved");
    }
    const payload:TokenPayload={
        userId:doctor.id!,
        email:doctor.email,
        name:doctor.name,
        role:'doctor',
    };

    const doctorAccessToken=this.authService.generateDoctorAccessToken(payload);
    const doctorRefereshToken=this.authService.generateDoctorRefreshToken(payload);
    await this.doctorRepo.update(doctor.id!,{
        refreshToken:doctorRefereshToken,
        refreshTokenExpiresAt:new Date(Date.now()+7*24*60*60*1000)
    })
        
        return{
            doctorAccessToken,
            doctorRefereshToken,
            doctor
        }
    }
}