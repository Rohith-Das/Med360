import { injectable, inject } from "tsyringe";
import { IPrescriptionRepository } from "../../domain/repositories/PrescriptionRepository";
import { Prescription } from "../../domain/entities/Prescription.entity";


@injectable()
export class UpdatePrescriptionUC {
  constructor(
    @inject('IPrescriptionRepository') private repo: IPrescriptionRepository
  ) {}

  async execute(id: string, updates: Partial<Prescription>): Promise<Prescription> {
    const prescription = await this.repo.findById(id);
    if (!prescription) {
      throw new Error('Prescription not found');
    }

    const updated = await this.repo.update(id, updates);
    if (!updated) {
      throw new Error('Failed to update prescription');
    }

    return updated;
  }
}
