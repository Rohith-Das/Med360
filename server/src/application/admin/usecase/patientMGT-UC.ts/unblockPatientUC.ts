import { injectable,inject } from "tsyringe";
import { IPatientRepository } from "../../../../domain/repositories/patientRepository_method";

@injectable()

export class unblockPatientUC{
    constructor(@inject("IPatientRepository")private repo:IPatientRepository){}
    async execute(patientId:string){
        const patient=await this.repo.findById(patientId);
        console.log('unblock uc patient',patient)
        if(!patient){
            throw new Error('Patient not found');
        }
        if(patient.isDeleted){
             throw new Error('can not ubclock a deleted patient');
        }
        return await this.repo.unblockPatient(patientId)
    }
}