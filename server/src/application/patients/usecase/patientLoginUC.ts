import { inject,injectable } from "tsyringe";
import { IPatientRepository } from "../../../domain/repositories/patientRepository_method";
import { HashService } from "../../service/HashService";
import { AuthService } from "../../service/AuthService";

@injectable()
export class patientLoginUC{
    constructor(
        @inject("IPatientRepository")private repo:IPatientRepository,
        @inject('HashService')private hashed:HashService,
        @inject('AuthService')private authService:AuthService
    ){}
    async execute({email,password}:{email:string,password:string}){
        const patient=await this.repo.findByEmail(email)
        if (!patient || !patient.password) {
            throw new Error("Invalid email or password");
        }
        const isMatch=await this.hashed.compare(password,patient.password)
           if (!isMatch) {
            throw new Error("Invalid email or password");
        }

        if (!patient.isVerified) {
            throw new Error("Please verify your email before login");
        }

        const payload={
            userId:patient.id!,
            email:patient.email,
            name:patient.name,
            role:patient.role,

        }
        return {
            accessToken:this.authService.generateAccessToken(payload),
            refreshToken:this.authService.generateRefreshToken(payload),
            patient:{
                id:patient.id!,
                name:patient.name,
                email:patient.email,
                mobile:patient.mobile,
                role:patient.role,
            }
        }
    }
}