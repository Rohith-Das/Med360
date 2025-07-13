import { Request,Response } from "express";
import { PatientModel } from "../../../infrastructure/database/models/patient.model";

export const verifyOtpController = async (req: Request, res: Response): Promise<Response> => {
    const {email,otp}=req.body;
     if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: "Email and OTP are required",
    });
  }

  try {
    const patient=await PatientModel.findOne({email})
     if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    if (patient.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Patient is already verified",
      });
    }

    const now=new Date();
     if (patient.otp !== otp || (patient.otpExpiresAt && now > patient.otpExpiresAt)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }
    patient.isVerified=true;
    patient.otp=undefined;
    patient.otpExpiresAt=undefined;
    await patient.save()
     return res.status(200).json({
      success: true,
      message: "OTP verified successfully. You can now log in.",
    });

  } catch (error:any) {
     console.error("OTP Verification Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error during OTP verification",
    });
  }
}
