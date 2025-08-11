import { injectable,inject } from "tsyringe";
import { IDoctorRepository } from "../../domain/repositories/DoctorRepository-method";
import { Doctor } from "../../domain/entities/Doctor.entity";
import { Doc } from "zod/v4/core/doc.cjs";

@injectable()
export class UpdateDoctorUC{
    constructor(
        @inject("IDoctorRepository") private repo:IDoctorRepository
    ){}
    async execute(id:string,data:Partial<Doctor>):Promise<Doctor>{
        const doctor=await this.repo.findById(id)
        if (!doctor) {
      throw new Error("Doctor not found");
    }

    await this.repo.update(id,data);
    const updatedDoctor=await this.repo.findById(id)
     if (!updatedDoctor) {
      throw new Error("Failed to retrieve updated doctor");
    }
    return updatedDoctor
    }
}