// import { injectable,inject } from "tsyringe";
// import { IApplicantRepository } from "../../domain/repositories/applicantRepository-method";
// import { Applicant } from "../../domain/entities/Applicant.entity";
// import { EmailService } from "../../infrastructure/email/email_service";
// import { OTPService } from "../../infrastructure/auth/otp_service";

// @injectable()
// export class ApproveApplicationUC{
//     constructor(
//         @inject('IApplicantRepository') private applicantRepo:IApplicantRepository,
//         @inject('EmailService')private emailService:EmailService,
//         @inject('OTPService')private otpService:OTPService
//     ){}

//     async execute(id:string):Promise<Applicant>{
//         const application=await this.applicantRepo.findById(id);
//          if (!application) {
//             throw new Error("Application not found");
//         }
//         const password=this.otpService.generateOTP();
//         const updatedApplication=await this.applicantRepo.update(id,{
//             status:"approved",
//            password
//         })
//          if (!updatedApplication) {
//             throw new Error("Failed to approve application");
//         }

//         await this.emailService.sendEmail({
//             to: updatedApplication.email,
//             subject: "Your Doctor Application Has Been Approved",
//             html: `
//                 <h2>Congratulations, ${updatedApplication.name}!</h2>
//                 <p>Your application to become a doctor on the Med360 platform has been approved.</p>
//                 <p>You can now log in to the doctor panel using the following credentials:</p>
//                 <ul>
//                     <li><strong>Email:</strong> ${updatedApplication.email}</li>
//                     <li><strong>Password:</strong> ${password}</li>
//                 </ul>
//                 <p>Please change your password after logging in for security purposes.</p>
//                 <p>Login here: <a href="http://localhost:5173/doctor/login">Doctor Login</a></p>
//             `
//         });

//         return updatedApplication;
//     }
// }