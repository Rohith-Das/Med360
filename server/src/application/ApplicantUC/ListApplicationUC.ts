import { injectable,inject } from "tsyringe";
import { IApplicantRepository } from "../../domain/repositories/applicantRepository-method";
import { Applicant } from "../../domain/entities/Applicant.entity";

@injectable()
export class ListApplicationUC{
    constructor(
        @inject('IApplicantRepository') private applicationRepo:IApplicantRepository
    ){}
    async execute(status?:'pending'|'approved'|'rejected'):Promise<Applicant[]>{
        return await this.applicationRepo.findAll(status)
    }
}