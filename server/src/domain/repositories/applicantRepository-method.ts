
import { Applicant } from "../entities/Applicant.entity";

export interface IApplicantRepository {
    create(applicant: Omit<Applicant, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Applicant>;
    findById(id: string): Promise<Applicant | null>;
    findAll(status?: "pending" | "approved" | "rejected"): Promise<Applicant[]>;
    update(id: string, updates: Partial<Applicant>): Promise<Applicant | null>;
    delete(id: string): Promise<boolean>;
     findByEmail(email: string): Promise<Applicant | null>;
}