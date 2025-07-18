import { Request,Response } from "express";
import { ResetPasswordWithOtpUC } from "../../../../application/patients/usecase/forgotPasswordUC/ResetPasswordWithOtpUC ";
import { container } from "tsyringe";
export const resetPasswordWithOtpController = async (req: Request, res: Response) => {
    try {
        const { email, otp, newPassword } = req.body;
        console.log("Request body:", req.body); 
        console.log("Password type:", typeof newPassword, "Value:", newPassword);
        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Email, OTP and new password are required"
            });
        }

        // Password validation
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long"
            });
        }
        if (typeof newPassword !== 'string') {
            return res.status(400).json({
                success: false,
                message: "Password must be a string"
            });
        }

        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                success: false,
                message: "OTP must be a 6-digit number"
            });
        }

        const useCase = container.resolve(ResetPasswordWithOtpUC);
        await useCase.execute(email.trim(), otp.toString(), newPassword.trim());
        
        return res.status(200).json({
            success: true,
            message: "Password reset successfully"
        });
    } catch (error: any) {
        console.error("Password reset error:", error);
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to reset password"
        });
    }
};