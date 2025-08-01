import { injectable, inject } from "tsyringe";
import { IApplicantRepository } from "../../domain/repositories/applicantRepository-method";
import { Applicant } from "../../domain/entities/Applicant.entity";

@injectable()
export class GetApplicationByIdUC {
    constructor(
        @inject('IApplicantRepository') private applicantRepo: IApplicantRepository
    ) {}

    async execute(id: string): Promise<Applicant | null> {
        return await this.applicantRepo.findById(id);
    }
}