
// server/src/presentation/middlewares/chatAuthGuard.ts
import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { AuthService } from '../../application/service/AuthService';
import { AuthRequest } from './AuthRequest';
import { TokenPayload } from '../../shared/AuthType';

export const chatAuthGuard = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    console.log('🔐 === CHAT AUTH DEBUG ===');
    console.log('Has Authorization header:', !!authHeader);
    console.log('Header preview:', authHeader?.substring(0, 50));

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

    // Try patient token first
    try {
      payload = authService.verifyAccessToken(token);
      tokenType = 'patient';
      console.log('✅ PATIENT TOKEN VERIFIED');
      console.log('Payload:', { 
        userId: payload.userId, 
        role: payload.role,
        name: payload.name,
        email: payload.email 
      });
    } catch (patientError: any) {
      console.log('⚠️ Patient token failed:', patientError.message);
      
      // Try doctor token
      try {
        payload = authService.verifyDoctorAccessToken(token);
        tokenType = 'doctor';
        console.log('✅ DOCTOR TOKEN VERIFIED');
        console.log('Payload:', { 
          userId: payload.userId, 
          role: payload.role,
          name: payload.name,
          email: payload.email 
        });
      } catch (doctorError: any) {
        console.error('❌ BOTH TOKENS FAILED');
        console.error('Patient error:', patientError.message);
        console.error('Doctor error:', doctorError.message);
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token' 
        });
      }
    }

    // Validate payload exists
    if (!payload) {
      console.error('❌ No payload extracted from token');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token payload' 
      });
    }

    // Validate role
    if (payload.role !== 'doctor' && payload.role !== 'patient') {
      console.error('❌ Invalid role in token:', payload.role);
      return res.status(403).json({ 
        success: false, 
        message: `Invalid user role for chat: ${payload.role}` 
      });
    }

    // ✅ Verify token type matches role
    if (tokenType === 'patient' && payload.role !== 'patient') {
      console.error('❌ TOKEN MISMATCH: patient token but role is', payload.role);
      return res.status(403).json({ 
        success: false, 
        message: 'Token type mismatch' 
      });
    }

    if (tokenType === 'doctor' && payload.role !== 'doctor') {
      console.error('❌ TOKEN MISMATCH: doctor token but role is', payload.role);
      return res.status(403).json({ 
        success: false, 
        message: 'Token type mismatch' 
      });
    }

    // Attach user info to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role as 'doctor' | 'patient'
    };

    console.log(`✅ CHAT AUTH SUCCESS: ${req.user.name} (${req.user.role}) - ID: ${req.user.userId}`);
    console.log('=========================\n');
    next();

  } catch (error: any) {
    console.error('❌ Chat auth middleware error:', error);

    if (error.message?.includes('expired') || error.message?.includes('jwt expired')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(500).json({ 
      success: false, 
      message: 'Authentication failed',
      error: error.message 
    });
  }
};