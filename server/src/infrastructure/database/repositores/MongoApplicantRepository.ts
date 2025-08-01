// src/infrastructure/database/repositories/MongoApplicantRepository.ts
import { injectable } from "tsyringe";
import { IApplicantRepository } from "../../../domain/repositories/applicantRepository-method";
import { Applicant } from "../../../domain/entities/Applicant.entity";
import { ApplicantModel } from "../models/ApplicantModel";

@injectable()
export class MongoApplicantRepository implements IApplicantRepository {
    async create(applicant: Omit<Applicant, 'id'>): Promise<Applicant> {
        const newApplicant = new ApplicantModel(applicant);
        const saved = await newApplicant.save();
        await saved.populate('specialization');
        
        return {
            id: saved._id.toString(),
            ...saved.toObject()
        };
    }

    async findById(id: string): Promise<Applicant | null> {
        const applicant = await ApplicantModel.findById(id).populate('specialization');
        if (!applicant) return null;
        
        return {
            id: applicant._id.toString(),
            ...applicant.toObject()
        };
    }

    async findAll(): Promise<Applicant[]> {
        const applicants = await ApplicantModel.find().populate('specialization').sort({ createdAt: -1 });
        return applicants.map(applicant => ({
            id: applicant._id.toString(),
            ...applicant.toObject()
        }));
    }

    async findByEmail(email: string): Promise<Applicant | null> {
        const applicant = await ApplicantModel.findOne({ email }).populate('specialization');
        if (!applicant) return null;
        
        return {
            id: applicant._id.toString(),
            ...applicant.toObject()
        };
    }

    async findByStatus(status: "pending" | "approved" | "rejected"): Promise<Applicant[]> {
        const applicants = await ApplicantModel.find({ status }).populate('specialization').sort({ createdAt: -1 });
        return applicants.map(applicant => ({
            id: applicant._id.toString(),
            ...applicant.toObject()
        }));
    }

    async update(id: string, updates: Partial<Applicant>): Promise<Applicant | null> {
        const updated = await ApplicantModel.findByIdAndUpdate(id, updates, { new: true }).populate('specialization');
        if (!updated) return null;

        return {
            id: updated._id.toString(),
            ...updated.toObject()
        };
    }

    async delete(id: string): Promise<boolean> {
        const result = await ApplicantModel.findByIdAndDelete(id);
        return !!result;
    }
}