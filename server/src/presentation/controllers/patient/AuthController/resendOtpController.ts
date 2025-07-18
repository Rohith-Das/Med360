import { Request,Response } from "express";
import { container } from "tsyringe";
import { ResendOtpUC } from "../../../../application/patients/usecase/AuthUseCase/ResendOtpUC";

export const resendOtpController = async (req: Request, res: Response): Promise<Response> => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  try {
    const resendOtpUC = container.resolve(ResendOtpUC);
    await resendOtpUC.execute(email);

    return res.status(200).json({
      success: true,
      message: "OTP resent successfully. Please check your email.",
    });

  } catch (error: any) {
    console.error("Resend OTP Error:", error.message);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};