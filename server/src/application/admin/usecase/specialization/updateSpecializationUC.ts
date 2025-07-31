import { injectable,inject } from "tsyringe";
import { ISpecializationRepository } from "../../../../domain/repositories/specializationRepository-method";
import { CloudinaryService } from "../../../../infrastructure/services/CloudinaryService";
import { Specialization } from "../../../../domain/entities/specialization.entity";

@injectable()
export class updateSpecializationUC{
    constructor(
        @inject ('ISpecializationRepository')private repo:ISpecializationRepository,
        @inject('CloudinaryService')private cloudinary:CloudinaryService
    ){}
    async execute(
        id:string,
        updates:{
            name?:string;
            description?:string;
            imageFile?:Express.Multer.File
        }
    ):Promise<Specialization|null>{
        let imageUrl:string | undefined;
        if(updates.imageFile){
            imageUrl=await this.cloudinary.uploadImage(updates.imageFile,'specializations')
        }
        const updateData:any={
            ...(updates.name && {name:updates.name}),
            ...(updates.description &&{description:updates.description}),
            ...(imageUrl && {imageUrl})
        }
        return this.repo.update(id,updateData)
    }
}