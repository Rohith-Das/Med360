import { Request,Response } from "express";
import { container } from "tsyringe";
import { RequestPasswordResetOtpUC } from "../../../../application/patients/usecase/forgotPasswordUC/RequestPasswordResetOtpUC ";

export const requestPasswordResetOtpController =async(req:Request,res:Response)=>{
    const {email}=req.body;
    if(!email){
      return res.status(400).json({
      success: false,
      message: "Email is required",
    });
    }
    
    try {
        const useCase=container.resolve(RequestPasswordResetOtpUC)
        await useCase.execute(email)
         return res.status(200).json({
      success: true,
      message: "OTP sent to your email for password reset",
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to send password reset OTP",
    });
  }
};