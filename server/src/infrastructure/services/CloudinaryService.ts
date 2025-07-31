import { injectable } from "tsyringe";
import { v2 as cloudinary } from "cloudinary";
import { Multer } from "multer"; 
import { Express } from "express"; 

@injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(file: Express.Multer.File, folder: string = "patient-profiles"): Promise<string> {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: folder,
        resource_type: "image",
        transformation: [
          { width: 300, height: 300, crop: "fill" },
          { quality: "auto" },
          { format: "webp" },
        ],
      });
      return result.secure_url;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new Error("Failed to upload image");
    }
  }

  async deleteImage(imageUrl: string): Promise<void> {
    try {
      const publicId = this.extractPublicId(imageUrl);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    } catch (error) {
      console.error("Cloudinary delete error:", error);
    }
  }

  private extractPublicId(imageUrl: string): string | null {
    try {
      const parts = imageUrl.split("/");
      const filename = parts[parts.length - 1];
      const publicId = filename.split(".")[0];
      const folderIndex = parts.findIndex((part) => part === "patient-profiles");
      if (folderIndex !== -1) {
        return `patient-profiles/${publicId}`;
      }
      return publicId;
    } catch (error) {
      return null;
    }
  }
}
