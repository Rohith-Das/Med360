import { injectable,inject } from "tsyringe";
import { IPatientRepository } from "../../../../domain/repositories/patientRepository_method";

@injectable()

export class blockPatientUC{
    constructor(@inject("IPatientRepository")private repo:IPatientRepository){}

    async execute(patientId:string){
        const patient=await this.repo.findById(patientId);
        if(!patient){
            throw new Error("patient not found in block uc")
        }
        if(patient.isDeleted){
            throw new Error('Cannot block a deleted patient');
        }
        if(patient.isBlocked){
            throw new Error('Patient is already blocked');
        }
        return await this.repo.blockPatient(patientId)
    }
}