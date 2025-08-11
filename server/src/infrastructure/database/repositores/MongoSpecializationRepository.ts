import { injectable } from "tsyringe";
import { ISpecializationRepository } from "../../../domain/repositories/specializationRepository-method";
import { Specialization } from "../../../domain/entities/specialization.entity";
import { SpecializationModel } from "../models/specialization.model";

@injectable()

export class MongoSpecializationRepository implements ISpecializationRepository{
    async create(specialization: Specialization): Promise<Specialization> {
        const newSpecialization=new SpecializationModel(specialization);
        const saved=await newSpecialization.save();
        return {
            id:saved._id.toString(),
            ...saved.toObject()
        }
    }
    async findById(id: string): Promise<Specialization | null> {
        const spec=await SpecializationModel.findById(id);
        if(!spec) return null
        return{
            id:spec._id.toString(),
            ...spec.toObject()
        }
    }
    async findAll(search?:string): Promise<Specialization[]> {
        const filter=search? {name:{$regex:search,$options:"i"}}:{}
        const spec=await SpecializationModel.find(filter)
        return spec.map(spec=>({
            id:spec._id.toString(),
            ...spec.toObject()
        }))
    }
    async update(id: string, updates: Partial<Specialization>): Promise<Specialization | null> {
        const updated=await SpecializationModel.findByIdAndUpdate(id,updates,{new:true});
       if(!updated) return null

        return {
            id:updated._id.toString(),
            ...updated?.toObject()
        }
    }

    async delete(id: string): Promise<boolean> {
        const res=await SpecializationModel.findByIdAndDelete(id);
        return !!res
    }
}