import { injectable } from "tsyringe";
import { IPatientRepository } from "../../../domain/repositories/patientRepository_method";
import { Patient } from "../../../domain/entities/patient.entity";
import { PatientModel } from "../models/patient.model";
import { createDeflate } from "zlib";

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
  async findAll(page: number, limit: number, filters?: { isBlocked?: boolean; isDeleted?: boolean; searchTerm?: string; }): Promise<{ patients: Patient[]; total: number; totalPages: number; currentPage: number; }> {
    const query:any={};
    if(filters?.isBlocked !== undefined){
      query.isBlocked=filters.isBlocked;
    }
    if(filters?.isDeleted !== undefined){
      query.isDeleted=filters.isDeleted;
    }else{
      query.isDeleted={$ne:true};
    }
    if(filters?.searchTerm){
      query.$or=[
        {name:{$regex:filters.searchTerm,$options:'i'}},
        {email:{$regex:filters.searchTerm,$options:'i'}},
        {mobile:{$regex:filters.searchTerm,$options:'i'}}
      ]
    }

    const skip=(page-1)*limit;
    const[patients,total]=await Promise.all([
      PatientModel.find(query)
      .select('-password -otp -refreshToken')
      .sort({createdAt:-1})
      .skip(skip)
      .limit(limit)
      .lean(),
      PatientModel.countDocuments(query)
    ])

    return {
      patients:patients.map(patient =>({
        id:patient._id.toString(),
        ...patient
      }))as Patient[],total,totalPages:Math.ceil(total/limit),
      currentPage:page
    };
  }
  async blockPatient(id: string): Promise<Patient> {
    const updated=await PatientModel.findByIdAndUpdate(
      id,
      {isBlocked:true},
      {new:true}
    );
    if(!updated){
      throw new Error("patient not found")
    }
    return {
      id:updated._id.toString(),
      ...updated.toObject()
    }
  }

  async unblockPatient(id: string): Promise<Patient> {
    const updated=await PatientModel.findByIdAndUpdate(
      id,
      {isBlocked:false},
      {new:true}
    );
    if(!updated){
      throw new Error("patient not found")
    }
    return {
      id:updated._id.toString(),
      ...updated.toObject()
    }
  }

  async softDeletedPatient(id: string): Promise<Patient> {
    const updated=await PatientModel.findByIdAndUpdate(
      id,
      {isDeleted:true},{new:true}
    );
    if(!updated){
      throw new Error("patient not found in delete patient")
    }

    return {
      id:updated._id.toString(),
      ...updated.toObject()
    }
  }

   async getPatientStats(): Promise<{ totalPatients: number; activedPatient: number; blockedPatient: number; deletedPatient: number; }> {
    const [totalPatients,activedPatient,blockedPatient,deletedPatient]=await Promise.all([
      PatientModel.countDocuments({isDeleted:{$ne:true}}),
      PatientModel.countDocuments({isBlocked:false,isDeleted:{$ne:true}}),
      PatientModel.countDocuments({isBlocked:true,isDeleted:{$ne:true}}),
      PatientModel.countDocuments({isDeleted:true})
    ])
    return {
      totalPatients,
      activedPatient,
      blockedPatient,
      deletedPatient
    }
  }
}
