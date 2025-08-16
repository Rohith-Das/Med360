import { injectable,inject } from "tsyringe";
import { IDoctorRepository } from "../../domain/repositories/DoctorRepository-method";
import { DoctorModel } from "../../infrastructure/database/models/DoctorModel";
import { Doc } from "zod/v4/core/doc.cjs";
import { Doctor } from "../../domain/entities/Doctor.entity";

@injectable()
export class GetAllDoctorUC {
  constructor(
    @inject('IDoctorRepository') private repo: IDoctorRepository
  ) {}

  async execute({ specializationId }: { specializationId?: string } = {}): Promise<Doctor[]> {
    const query: { status?: string; specialization?: string } = { status: 'approved' };
    if (specializationId) {
      query.specialization = specializationId;
    }
    return await this.repo.findAll(query);
  }
}