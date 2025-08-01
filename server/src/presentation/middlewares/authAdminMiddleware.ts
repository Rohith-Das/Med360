import { NextFunction, Request,Response } from "express";
import { container } from "tsyringe";
import { AuthService } from "../../application/service/AuthService";
import { AuthRequest } from "./AuthRequest";


export const adminAuthGuard = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("Authorization Header:", authHeader); // Debug 1

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    console.log("Extracted Token:", token); // Debug 2

    const authService = container.resolve<AuthService>("AuthService");
    
    try {
      const payload = authService.verifyAdminAccessToken(token);
      console.log("Decoded Payload:", payload); // Debug 3

      if (payload.role !== "admin") {
        return res.status(403).json({ success: false, message: "Admin access required" });
      }

      req.user = payload;
      next();
    } catch (verifyError) {
      console.error("Token Verification Error:", verifyError); // Debug 4
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};