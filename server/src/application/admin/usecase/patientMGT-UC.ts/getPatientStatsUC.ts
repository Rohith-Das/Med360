import { injectable,inject } from "tsyringe";
import { IPatientRepository } from "../../../../domain/repositories/patientRepository_method";

@injectable()
export class getPatientStats{
    constructor(@inject("IPatientRepository")private repo:IPatientRepository){}
    async execute(){
        return await this.repo.getPatientStats()
    }
}