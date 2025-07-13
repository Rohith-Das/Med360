import { Request,Response } from "express";
import { PatientModel } from "../../../infrastructure/database/models/patient.model";
import { container } from "tsyringe";
import { EmailService } from "../../../infrastructure/email/email_service";
import { OTPService } from "../../../infrastructure/auth/otp_service";
import { success } from "zod";

export const resendOtpController =async(req:Request,res:Response):Promise<Response> =>{
    const {email}=req.body;
    if(!email){
        return res.status(400).json({
            success:false,
            message:"Email is required",
        })
    }
    try {

    const patient= await PatientModel.findOne({email})
    if(!patient){
        return res.status(404).json({
            success:false,
            message:"Patient not found",
        })
    }
    if (patient.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Patient is already verified",
      });
    }
    const now=new Date();
    if(patient.otpExpiresAt &&now < patient.otpExpiresAt ){
    const secondsLeft = Math.ceil((patient.otpExpiresAt.getTime() - now.getTime()) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${secondsLeft} seconds before resending OTP.`,
      });        
    }
    const otpService=container.resolve(OTPService)
    const emailService=container.resolve(EmailService);
    const otp=otpService.generateOTP();
    const otpExpiresAt = new Date(now.getTime() + Number(process.env.OTP_EXPIRE_TIME || "120") * 1000);

    patient.otp=otp;
    patient.otpExpiresAt=otpExpiresAt;
    await patient.save()
    await emailService.sendEmail(
      email,
      "Resend OTP - Verify Your Account",
      `<p>Your new OTP is <strong>${otp}</strong>. It will expire in ${process.env.OTP_EXPIRE_TIME || "120"} seconds.</p>`
    );
 return res.status(200).json({
      success: true,
      message: "OTP resent successfully. Please check your email.",
    });

    } catch (error: any) {
    console.error("Resend OTP Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while resending OTP",
    });
  }
};