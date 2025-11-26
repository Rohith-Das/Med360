import { injectable, inject } from "tsyringe";
import { IPrescriptionRepository } from "../../domain/repositories/PrescriptionRepository";
import { Prescription } from "../../domain/entities/Prescription.entity";

@injectable()
export class GetPrescriptionByAppointmentUC {
  constructor(
    @inject('IPrescriptionRepository') private repo: IPrescriptionRepository
  ) {}

  async execute(appointmentId: string): Promise<Prescription | null> {
    return await this.repo.findByAppointmentId(appointmentId);
  }
}

