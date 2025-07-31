import { injectable,inject } from "tsyringe";
import { ISpecializationRepository } from "../../../../domain/repositories/specializationRepository-method";    
import { CloudinaryService } from "../../../../infrastructure/services/CloudinaryService";

@injectable()
export class DeleteSpecializationUC{
      constructor(
    @inject("ISpecializationRepository") private repo: ISpecializationRepository,
    @inject("CloudinaryService") private cloudinary: CloudinaryService
  ) {}
  async execute(id:string):Promise<boolean>{
    const sp=await this.repo.findById(id)
    if(!sp) return false
    if(sp.imageUrl){
        await this.cloudinary.deleteImage(sp.imageUrl)
    }
    return this.repo.delete(id)
  }
}