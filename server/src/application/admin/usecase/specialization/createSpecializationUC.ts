import { injectable,inject } from "tsyringe";
import { ISpecializationRepository } from "../../../../domain/repositories/specializationRepository-method";
import { CloudinaryService } from "../../../../infrastructure/services/CloudinaryService";
import { Specialization } from "../../../../domain/entities/specialization.entity";
import { string } from "zod";

@injectable()
export class CreateSpecializationUC{
    constructor(
        @inject('ISpecializationRepository')private repo:ISpecializationRepository,
        @inject ('CloudinaryService')private cloudinary:CloudinaryService
    ){}

    async execute(data: Omit<Specialization,'id'>&{imageFile?:Express.Multer.File}): Promise<Specialization> {
    if (!data.imageFile) {
        throw new Error("Image file is required");
    }

    // Upload to Cloudinary
    let imageUrl: string;
    try {
        imageUrl = await this.cloudinary.uploadImage(data.imageFile, 'specializations');
        if (!imageUrl) {
            throw new Error("Image upload failed");
        }
    } catch (error:any) {
        throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Create specialization
    return this.repo.create({
        name: data.name,
        description: data.description,
        imageUrl
    });
}
}