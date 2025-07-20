import { injectable,inject } from "tsyringe";
import { IPatientRepository } from "../../../domain/repositories/patientRepository_method";

@injectable()

export class SoftDeletePatientUC {
    constructor(@inject('IPatientRepository')private repo:IPatientRepository){}

    async execute(patientId:string){
        const patient=await this.repo.findById(patientId)
        if(patient?.isDeleted){
            throw new Error("patient is already deleted")
        }
        if(!patient){
            throw new Error("pateient not found")
        }

        return await this.repo.softDeletedPatient(patientId)
    }
}