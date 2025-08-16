import { IDoctorRepository } from "../../../domain/repositories/DoctorRepository-method";
import { Doctor } from "../../../domain/entities/Doctor.entity";
import { DoctorModel } from "../models/DoctorModel";
import { injectable } from "tsyringe";

@injectable()
export class MongoDoctorRepository implements IDoctorRepository{
    async findById(id: string): Promise<Doctor | null> {
        const doctor=await DoctorModel.findById(id).populate('specialization')
        if(!doctor) return null
        return {
            id:doctor._id.toString(),
            ...doctor.toObject(),
        }
    }
    async create(doctor: Omit<Doctor, "id">): Promise<Doctor> {
        const newDoctor=new DoctorModel(doctor)
        const saved=await newDoctor.save()
        await saved.populate('specialization')
        return{
            id:saved._id.toString(),
            ...saved.toObject()
        }
    }
    async findByEmail(email: string): Promise<Doctor | null> {
        const doctor=await DoctorModel.findOne({email}).populate('specialization')
        if (!doctor) return null;
        return{
            id:doctor?._id.toString(),
            ...doctor?.toObject(),
        }
    }
    async update(id: string, updates: Partial<Doctor>): Promise<Doctor | null> {
        const updated=await DoctorModel.findByIdAndUpdate(id,updates,{new:true}).populate('specialization');
        if(!updated) return null
        return{
            id:updated._id.toString(),
            ...updated.toObject()
        }
    }
    async delete(id: string): Promise<boolean> {
    const result = await DoctorModel.findByIdAndDelete(id);
    return !!result;
  }
   async findAll(query: { status?: string ;specialization?:string}): Promise<Doctor[]> {
    const doctor= await DoctorModel.find(query).populate('specialization').exec();
    return doctor.map((doc)=>({
        id:doc._id.toString(),
        ...doc.toObject()
    }))
  }
}