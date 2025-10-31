// server/src/presentation/middlewares/chatAuthGuard.ts
import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { AuthService } from '../../application/service/AuthService';
import { AuthRequest } from './AuthRequest';
import { TokenPayload } from '../../shared/AuthType';

export const chatAuthGuard = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const token = authHeader.split(' ')[1];
    const authService = container.resolve<AuthService>('AuthService');

    let payload: TokenPayload | null = null;
    let tokenType: 'patient' | 'doctor' | null = null;

    console.log('🔐 Chat auth attempt');

    // Try patient token first
    try {
      payload = authService.verifyAccessToken(token);
      tokenType = 'patient';
      console.log('✅ Patient token verified:', { userId: payload.userId, role: payload.role });
    } catch (patientError) {
      // If patient token fails, try doctor token
      try {
        payload = authService.verifyDoctorAccessToken(token);
        tokenType = 'doctor';
        console.log('✅ Doctor token verified:', { userId: payload.userId, role: payload.role });
      } catch (doctorError) {
        console.error('❌ Both token verifications failed:', {
        });
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token' 
        });
      }
    }

    // Validate role (must be either doctor or patient)
    if (payload.role !== 'doctor' && payload.role !== 'patient') {
      console.error('❌ Invalid role in token:', payload.role);
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid user role for chat' 
      });
    }

    // Attach user info to request
    req.user = {
      ...payload,
      role: payload.role as 'doctor' | 'patient'
    };

    console.log(`✅ Chat auth successful: ${req.user.name} (${req.user.role})`);
    next();

  } catch (error: any) {
    console.error('❌ Chat auth middleware error:', error);

    // Handle token expiration specifically
    if (error.message?.includes('expired') || error.message?.includes('jwt expired')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(500).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
};