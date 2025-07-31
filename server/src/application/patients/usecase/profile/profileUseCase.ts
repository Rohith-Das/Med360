import { inject,injectable } from "tsyringe";
import { IPatientRepository } from "../../../../domain/repositories/patientRepository_method";
import { Patient } from "../../../../domain/entities/patient.entity";

@injectable()
export class PatientProfileUseCase {
  constructor(@inject("IPatientRepository") private patientRepository: IPatientRepository) {}

  async getProfile(id: string): Promise<Patient | null> {
    const patient = await this.patientRepository.findById(id);
    if (!patient) {
      throw new Error("Patient not found");
    }
    return patient;
  }

  async updateProfile(id: string, data: Partial<Patient>): Promise<Patient | null> {
    // Validation
    if (data.email) {
      throw new Error("Email cannot be updated");
    }
    if (data.name && data.name.trim() === "") {
      throw new Error("Name cannot be empty");
    }
    if (data.mobile && !/^\d{10}$/.test(data.mobile)) {
      throw new Error("Invalid mobile number");
    }
    if (data.gender && !["male", "female"].includes(data.gender)) {
      throw new Error("Invalid gender");
    }
    if (data.dateOfBirth && isNaN(new Date(data.dateOfBirth).getTime())) {
      throw new Error("Invalid date of birth");
    }
    if (data.address && data.address.trim() === "") {
      throw new Error("Address cannot be empty");
    }

    const updatedPatient = await this.patientRepository.update(id, data);
    return updatedPatient;
  }

  async updateProfilePicture(id:string,imageUrl:string):Promise<Patient|null>{
    return this.patientRepository.update(id,{profilePicture:imageUrl})
  }
  async removeProfilePicture(id:string):Promise<Patient|null>{
    return this.patientRepository.update(id,{profilePicture:undefined})
  }
}