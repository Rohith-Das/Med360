// import { injectable, inject } from "tsyringe";
// import { IApplicantRepository } from "../../domain/repositories/applicantRepository-method";
// import { Applicant } from "../../domain/entities/Applicant.entity";
// import { EmailService } from "../../infrastructure/email/email_service";

// @injectable()
// export class RejectApplicationUC {
//     constructor(
//         @inject('IApplicantRepository') private applicantRepo: IApplicantRepository,
//         @inject('EmailService') private emailService: EmailService
//     ) {}

//     async execute(id: string): Promise<Applicant> {
//         const application = await this.applicantRepo.findById(id);
//         if (!application) {
//             throw new Error("Application not found");
//         }

//         const updatedApplication = await this.applicantRepo.update(id, { status: "rejected" });

//         if (!updatedApplication) {
//             throw new Error("Failed to reject application");
//         }

//         // Send rejection email
//         await this.emailService.sendEmail({
//             to: updatedApplication.email,
//             subject: "Your Doctor Application Status",
//             html: `
//                 <h2>Dear ${updatedApplication.name},</h2>
//                 <p>We regret to inform you that your application to become a doctor on the Med360 platform has been rejected.</p>
//                 <p>Thank you for your interest in joining our platform. You may reapply in the future if circumstances change.</p>
//                 <p>For any questions, please contact our support team.</p>
//             `
//         });

//         return updatedApplication;
//     }
// }