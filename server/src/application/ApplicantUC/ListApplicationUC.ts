import { injectable,inject } from "tsyringe";
import { IApplicantRepository } from "../../domain/repositories/applicantRepository-method";
import { Applicant } from "../../domain/entities/Applicant.entity";

@injectable()
export class ListApplicationUC{
    constructor(
        @inject('IApplicantRepository') private applicationRepo:IApplicantRepository
    ){}
    async execute(page:number,limit:number,status?:'pending'|'approved'|'rejected',search?:string):Promise<{applications:Applicant[],totalPages:number}>{
        const applications=await this.applicationRepo.findAllWithPagination(page,limit,status,search);
        const totalCount=await this.applicationRepo.countAll(status,search);
        const totalPages=Math.ceil(totalCount/limit)

        return {
            applications,
            totalPages
        }
    }
}