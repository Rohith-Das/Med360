import { Request,Response,NextFunction } from "express";
import { container } from "tsyringe";
import { AuthService } from "../../application/service/AuthService";
import { AuthRequest } from "./AuthRequest";

export const authGuard = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    console.log("token from mid",token)
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized access' });
    }

    const authService = container.resolve<AuthService>("AuthService");
    const payload = authService.verifyAccessToken(token);

    req.user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Unauthorized access' });
  }
};