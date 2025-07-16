import { Request, Response } from "express";
import { container } from "tsyringe";
import { VerifyOtpUC } from "../../../application/patients/usecase/verifyOtpUC";

export const verifyOtpController = async (req: Request, res: Response): Promise<Response> => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: "Email and OTP are required",
    });
  }

  try {
    const verifyOtpUC = container.resolve(VerifyOtpUC);
    await verifyOtpUC.execute(email, otp);

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully. You can now log in.",
    });

  } catch (error: any) {
    console.error("OTP Verification Error:", error.message);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
