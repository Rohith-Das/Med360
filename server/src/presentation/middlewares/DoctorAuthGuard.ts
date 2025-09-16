import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { AuthService } from '../../application/service/AuthService';
import { AuthRequest } from './AuthRequest';

export const doctorAuthGuard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const authService = container.resolve<AuthService>("AuthService");

    try {
      const payload = authService.verifyDoctorAccessToken(token);
      // console.log("Decoded payload:", payload);

      if (payload.role !== "doctor") {
        return res.status(403).json({ success: false, message: "Doctor access required" });
      }

      req.user = payload;
      next();
    } catch (verifyError: any) {
      console.error("Token Verification Error:", verifyError.message);
      
      if (verifyError.message === "Token expired") {
        // Allow the request to continue to the refresh token interceptor
        // The client will handle token refresh automatically
        return res.status(401).json({ 
          success: false, 
          message: "Token expired",
          code: "TOKEN_EXPIRED"
        });
      }

      return res.status(401).json({ 
        success: false, 
        message: "Invalid token" 
      });
    }
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};