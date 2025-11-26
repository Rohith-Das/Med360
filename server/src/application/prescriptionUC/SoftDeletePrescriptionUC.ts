import { injectable, inject } from "tsyringe";
import { IPrescriptionRepository } from "../../domain/repositories/PrescriptionRepository";

@injectable()
export class SoftDeletePrescriptionUC {
  constructor(
    @inject('IPrescriptionRepository') private repo: IPrescriptionRepository
  ) {}

  async execute(id: string, doctorId: string): Promise<boolean> {
    const prescription = await this.repo.findById(id);
    if (!prescription) {
      throw new Error('Prescription not found');
    }

    if (prescription.doctorId !== doctorId) {
      throw new Error('Unauthorized to delete this prescription');
    }

    return await this.repo.softDelete(id);
  }
}