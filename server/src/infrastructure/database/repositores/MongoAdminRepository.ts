import { injectable  } from "tsyringe";
import { IAdminRepository } from "../../../domain/repositories/adminRepository-method";
import { Admin } from "../../../domain/entities/admin.entity";
import { AdminModel } from "../models/adminModel";

@injectable()
export class MongoAdminRepository implements IAdminRepository{
    async create(admin: Admin): Promise<Admin> {
        const newAdmin=new AdminModel(admin)
        const saveAdmin= await newAdmin.save()
        return {
            id:saveAdmin._id.toString(),
            ...saveAdmin.toObject()
        }
    }
    async findByEmail(email: string): Promise<Admin | null> {
        const admin=await AdminModel.findOne({email});
        if(!admin){
            return null
        }
        return {
            id:admin._id.toString(),
            ...admin.toObject()
        }
    }
    async findById(id: string): Promise<Admin | null> {
        const admin=await AdminModel.findById(id);
        if(!admin){
            return null
        }
        return {
            id:admin._id.toString(),
            ...admin.toObject()
        }
    }
    async update(id: string, updates: Partial<Admin>): Promise<Admin> {
        const updated=await AdminModel.findByIdAndUpdate(id,updates,{new:true} )
        if(!updated){
            throw new Error('Admin not found for update');
        }
        return {
            id:updated._id.toString(),
            ...updated.toObject()
        }
    }
}