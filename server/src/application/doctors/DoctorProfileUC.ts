import { injectable,inject } from "tsyringe";
import { IDoctorRepository } from "../../domain/repositories/DoctorRepository-method";
import { Doctor } from "../../domain/entities/Doctor.entity";
import { promises } from "dns";

@injectable()

export class DoctorProfileUC{
    constructor(
        @inject('IDoctorRepository') private Repo:IDoctorRepository
    ){}
    async getProfile(id:string):Promise<Doctor|null>{
        const doctor=await this.Repo.findById(id)
        if(!doctor){
            throw new Error("doctor not found")
        }
        return doctor
    }

}

