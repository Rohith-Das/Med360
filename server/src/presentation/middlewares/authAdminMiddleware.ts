import { NextFunction, Request,Response } from "express";
import { container } from "tsyringe";
import { AuthService } from "../../application/service/AuthService";
import { AuthRequest } from "./AuthRequest";

export const adminAuthGuard = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized admin access' });
    }

    const authService = container.resolve<AuthService>("AuthService");
    const payload = authService.verifyAdminAccessToken(token);

    if (payload.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    req.user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Unauthorized admin access' });
  }
};