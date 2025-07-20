import { injectable,inject } from "tsyringe";
import { IPatientRepository } from "../../../domain/repositories/patientRepository_method";

@injectable()

export class unblockPatientUC{
    constructor(@inject("IPatientRepository")private repo:IPatientRepository){}
    async execute(patientId:string){
        const patient=await this.repo.findById(patientId);
        if(!patient){
            throw new Error('Patient not found');
        }
        if(patient.isDeleted){
             throw new Error('can not ubclock a deleted patient');
        }
        if(patient.isBlocked){
             throw new Error('Patient not not blocked');
        }
        return await this.repo.unblockPatient(patientId)
    }
}