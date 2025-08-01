// src/application/applicant/usecase/SubmitApplicationUC.ts
import { injectable, inject } from "tsyringe";
import { IApplicantRepository } from "../../domain/repositories/applicantRepository-method";
import { ISpecializationRepository } from "../../domain/repositories/specializationRepository-method";
import { CloudinaryService } from "../../infrastructure/services/CloudinaryService";
import { Applicant } from "../../domain/entities/Applicant.entity";
import { cleanupFile } from "../../infrastructure/config/multerConfig";
import mongoose, { Types } from 'mongoose';


interface SubmitApplicationData {
    name: string;
    email: string;
    phone: string;
    registerNo: string;
    experience: number;
    languages: string[];
    specializationId: string;
    licensedState: string;
    idProofFile: Express.Multer.File;
    resumeFile: Express.Multer.File;
}

@injectable()
export class SubmitApplicationUC {
    constructor(
        @inject('IApplicantRepository') private applicantRepo: IApplicantRepository,
        @inject('ISpecializationRepository') private specializationRepo: ISpecializationRepository,
        @inject('CloudinaryService') private cloudinaryService: CloudinaryService
    ) {}

    async execute(data: SubmitApplicationData): Promise<Applicant> {
        try {
            // Check if applicant already exists
            const existingApplicant = await this.applicantRepo.findByEmail(data.email);
            if (existingApplicant) {
                throw new Error("Application already exists for this email");
            }

            // Verify specialization exists
            const specialization = await this.specializationRepo.findById(data.specializationId);
            if (!specialization) {
                throw new Error("Invalid specialization selected");
            }

            // Upload files to Cloudinary
            const [idProofUrl, resumeUrl] = await Promise.all([
                this.cloudinaryService.uploadDocument(data.idProofFile, 'doctor-applications/id-proofs'),
                this.cloudinaryService.uploadDocument(data.resumeFile, 'doctor-applications/resumes')
            ]);

            // Create application
            const applicationData = {
                name: data.name,
                email: data.email,
                phone: data.phone,
                registerNo: data.registerNo,
                experience: data.experience,
                languages: data.languages,
                specialization: new mongoose.Types.ObjectId(data.specializationId),
                licensedState: data.licensedState,
                idProof: idProofUrl,
                resume: resumeUrl,
                status: "pending" as const
                
            };

            const application = await this.applicantRepo.create(applicationData);

            // Clean up temporary files
            cleanupFile(data.idProofFile.path);
            cleanupFile(data.resumeFile.path);

            return application;

        } catch (error) {
            // Clean up files in case of error
            cleanupFile(data.idProofFile.path);
            cleanupFile(data.resumeFile.path);
            throw error;
        }
    }
}