import { injectable,inject   } from "tsyringe";
import { IDoctorRepository } from "../../domain/repositories/DoctorRepository-method";
import { Doctor } from "../../domain/entities/Doctor.entity";
import { privateDecrypt } from "crypto";

@injectable()
export class BlockDoctorUC{
    constructor(
        @inject("IDoctorRepository") private repo:IDoctorRepository
    ){}
    async execute(id:string):Promise<void>{
        const doctor=await this.repo.findById(id)
        if (!doctor) {
      throw new Error("Doctor not found");
    }
await this.repo.update(id,{isBlocked:true})
    }
}