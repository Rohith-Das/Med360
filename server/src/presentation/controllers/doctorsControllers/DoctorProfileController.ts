import { Request,Response } from "express";
import { container } from "tsyringe";
import { DoctorProfileUC } from "../../../application/doctors/DoctorProfileUC";
import { AuthRequest } from "../../middlewares/AuthRequest";
import { CloudinaryService } from "../../../infrastructure/services/CloudinaryService";
import { email, success } from "zod";


export const getDoctorProfileController=async(req:AuthRequest,res:Response):Promise<Response>=>{
   try {
     const doctorId=req.user?.userId
    if(!doctorId){
     return res.status(401).json({ success: false, message: "Unauthorized from getDoctorprofile controller" });
    }
    const uc=container.resolve(DoctorProfileUC)
    const profile=await uc.getProfile(doctorId);
    return res.status(200).json({
        success:true,
        data:{
            id:profile?.id,
            name:profile?.name,
            email:profile?.email,
            phone:profile?.phone,
            registerNo:profile?.registerNo,
            specialization:profile?.specialization,
            experience:profile?.experience,
            languages:profile?.languages,
            profileImage:profile?.profileImage,
            dateOfBirth:profile?.dateOfBirth,
            education:profile?.education,
           licensedState: profile?.licensedState,
            
        }
    })
   } catch (error:any) {
        return res.status(400).json({ success: false, message: error.message });
   }
}