import { injectable,inject } from "tsyringe";
import { IPrescriptionRepository } from "../../../domain/repositories/PrescriptionRepository";
import { Prescription } from "../../../domain/entities/Prescription.entity";
import { PrescriptionModel } from "../models/PrescriptionModel";

@injectable()
export class MongoPrescriptionRepo implements IPrescriptionRepository{
    async create(Prescription: Omit<Prescription, "id">): Promise<Prescription> {
        const newPrescription=new PrescriptionModel(Prescription)
        const saved=await newPrescription.save();
        return{
            ...saved.toObject(),
            id:saved._id.toString()
        }
    }
     async findById(id: string): Promise<Prescription | null> {
    const prescription = await PrescriptionModel.findOne({ _id: id, isDeleted: false })
      .populate('doctorId', 'name specialization')
      .populate('patientId', 'name email');
    
    if (!prescription) return null;
    
    return {
      ...prescription.toObject(),
      id: prescription._id.toString()
    };
  }

  async findByAppointmentId(appointmentId: string): Promise<Prescription | null> {
    const prescription = await PrescriptionModel.findOne({ appointmentId, isDeleted: false })
      .populate('doctorId', 'name specialization')
      .populate('patientId', 'name email');
    
    if (!prescription) return null;
    
    return {
      ...prescription.toObject(),
      id: prescription._id.toString()
    };
  }

  async findByDoctorId(doctorId: string): Promise<Prescription[]> {
    const prescriptions = await PrescriptionModel.find({ doctorId, isDeleted: false })
      .populate('patientId', 'name email')
      .populate('appointmentId', 'date startTime')
      .sort({ createdAt: -1 });
    
    return prescriptions.map(p => ({
      ...p.toObject(),
      id: p._id.toString()
    }));
  }

  async findByPatientId(patientId: string): Promise<Prescription[]> {
    const prescriptions = await PrescriptionModel.find({ patientId, isDeleted: false })
      .populate('doctorId', 'name specialization')
      .populate('appointmentId', 'date startTime')
      .sort({ createdAt: -1 });
    
    return prescriptions.map(p => ({
      ...p.toObject(),
      id: p._id.toString()
    }));
  }

  async update(id: string, updates: Partial<Prescription>): Promise<Prescription | null> {
    const updated = await PrescriptionModel.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    );
    
    if (!updated) return null;
    
    return {
      ...updated.toObject(),
      id: updated._id.toString()
    };
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await PrescriptionModel.findByIdAndUpdate(
      id,
      { isDeleted: true, updatedAt: new Date() }
    );
    return !!result;
  }
}









