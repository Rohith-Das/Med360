import { Request,Response } from "express";
import { container } from "tsyringe";
import { PatientProfileUseCase } from "../../../../application/patients/usecase/profile/profileUseCase";
import { AuthRequest } from "../../../middlewares/AuthRequest";
import { CloudinaryService } from "../../../../infrastructure/services/CloudinaryService";
import { upload } from "../../../../infrastructure/config/multerConfig";


export const getProfileController = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const patientId = req.user?.userId;
    if (!patientId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const useCase = container.resolve(PatientProfileUseCase);
    const profile = await useCase.getProfile(patientId);
    return res.status(200).json({
      success: true,
      data: {
        id: profile?.id,
        name: profile?.name,
        email: profile?.email,
        mobile: profile?.mobile,
        gender: profile?.gender,
        dateOfBirth: profile?.dateOfBirth,
        address: profile?.address,
        profilePicture:profile?.profilePicture,
      },
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateProfileController = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const patientId = req.user?.userId;
    if (!patientId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const useCase = container.resolve(PatientProfileUseCase);
    const updatedProfile = await useCase.updateProfile(patientId, req.body);
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: updatedProfile?.id,
        name: updatedProfile?.name,
        email: updatedProfile?.email,
        mobile: updatedProfile?.mobile,
        gender: updatedProfile?.gender,
        dateOfBirth: updatedProfile?.dateOfBirth,
        address: updatedProfile?.address,
        profilePicture:updatedProfile?.profilePicture,
      },
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const uploadProfilePicture=async(req:AuthRequest,res:Response)=>{
    try {
        const patientId=req.user?.userId;
        if (!patientId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const file=req.file;
     if (!file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    const cloudinaryService =container.resolve(CloudinaryService);
    const profileUseCase=container.resolve(PatientProfileUseCase);

    const imageUrl=await cloudinaryService.uploadImage(file,'patient-profile');
    const updatedPatient=await profileUseCase.updateProfile(patientId,{
        profilePicture:imageUrl
    })
    return res.status(200).json({
        success:true,
        message:"profile picture uploaded successfully",
        data:{
            profilePicture:imageUrl
        }
    })
    } catch (error:any) {
         return res.status(500).json({ success: false, message: error.message });
    }
}

export const removeProfilePicture=async (req:AuthRequest,res:Response)=>{
    try {
        const patientId=req.user?.userId;
         if (!patientId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const profileUseCase=container.resolve(PatientProfileUseCase)
    const cloudinaryService=container.resolve(CloudinaryService)

    //get curr profile
    const patient=await profileUseCase.getProfile(patientId);
     if (!patient?.profilePicture) {
      return res.status(400).json({ success: false, message: "No profile picture to remove" });
    }

    //delete from cloudinary
    await cloudinaryService.deleteImage(patient.profilePicture)
    //remove from patient profile
    const updatedPatient=await profileUseCase.updateProfile(patientId,{profilePicture:undefined});
    return res.status(200).json({
        success:true,
        message:"profile picture removed successfully"
    })
    } catch (error:any) {
            return res.status(500).json({ success: false, message: error.message });
    }
}