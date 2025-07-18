import { injectable } from "tsyringe";
import { IPatientRepository } from "../../../domain/repositories/patientRepository_method";
import { Patient } from "../../../domain/entities/patient.entity";
import { PatientModel } from "../models/patient.model";

@injectable()
export class MongoPatientRepository implements IPatientRepository {
  async create(patient: Patient): Promise<Patient> {
    const newPatient = new PatientModel(patient);
    const savedPatient = await newPatient.save();
    return { id: savedPatient._id.toString(), ...savedPatient.toObject() };
  }
  async findByEmail(email: string): Promise<Patient | null> {
    const patient = await PatientModel.findOne({ email });
    if (!patient) {
      return null;
    }
    return { id: patient._id.toString(), ...patient.toObject() };
  }
  async findByMobileNumber(mobile: string): Promise<Patient | null> {
    const patient = await PatientModel.findOne({ mobile });
    if (!patient) {
      return null;
    }
    return { id: patient._id.toString(), ...patient.toObject() };
  }
  async findById(id: string): Promise<Patient | null> {
    const patient = await PatientModel.findById(id);
    if (!patient) {
      return null;
    }
    return { id: patient._id.toString(), ...patient.toObject() };
  }
  async update(id: string, updates: Partial<Patient>): Promise<Patient> {
    const updated = await PatientModel.findByIdAndUpdate(id, updates, {
      new: true,
    });
    if (!updated) {
      throw new Error("Patient not found for update");
    }
    return { id: updated._id.toString(), ...updated.toObject() };
  }
  async requestPasswordRest(email: string, otp: string, otpExpiresAt: Date): Promise<void> {
       const result = await PatientModel.updateOne(
            { email },
            { 
                $set: { 
                    otp, 
                    otpExpiresAt 
                } 
            }
        );
        if (result.matchedCount === 0) {
            throw new Error("No account found with this email address");
        }
  }
  async resetPasswordWithOtp(email: string, otp: string, newPassword:string): Promise<Patient> {
      const patient = await PatientModel.findOneAndUpdate(
            { 
                email, 
                otp, 
                otpExpiresAt: { $gt: new Date() } 
            },
            {
                $set: { password: newPassword },
                $unset: { otp: "", otpExpiresAt: "" }
            },
            { new: true }
        );
      if(!patient){
         throw new Error("Invalid OTP or OTP has expired");
      }
     return { id: patient._id.toString(), ...patient.toObject() };
  }
}
