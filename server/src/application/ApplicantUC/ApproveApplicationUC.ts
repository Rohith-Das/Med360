import { injectable,inject } from "tsyringe";
import { IApplicantRepository } from "../../domain/repositories/applicantRepository-method";
import { Applicant } from "../../domain/entities/Applicant.entity";


@injectable()
export class ApproveApplicationUC{
    constructor(
        @inject('IApplicantRepository') private applicantRepo:IApplicantRepository,
    
    ){}

    async execute(id:string):Promise<Applicant>{
        const application=await this.applicantRepo.findById(id);
         if (!application) {
            throw new Error("Application not found");
        }
        console.log('Approving application for email:', application.email);
         if (application.status === 'approved') {
      throw new Error("Application is already approved");
    }
        const updatedApplication=await this.applicantRepo.update(id,{
            status:"approved",
          
        })

         if (!updatedApplication) {
            throw new Error("Failed to approve application");
        }


        return updatedApplication;
    }
}