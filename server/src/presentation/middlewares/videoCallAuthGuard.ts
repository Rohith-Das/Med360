// server/src/presentation/middlewares/videoCallAuthGuard.ts

import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { AuthService } from '../../application/service/AuthService';
import { AuthRequest } from './AuthRequest';
import { TokenPayload } from '../../shared/AuthType';

export const videoCallAuthGuard = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    console.log('📹 === VIDEO CALL AUTH DEBUG ===');
    console.log('Has Authorization header:', !!authHeader);
    console.log('Header preview:', authHeader?.substring(0, 50) + '...');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided for video call access',
      });
    }

    const token = authHeader.split(' ')[1];
    const authService = container.resolve<AuthService>('AuthService');

    let payload: TokenPayload | null = null;
    let tokenType: 'patient' | 'doctor' | null = null;

    // Step 1: Try Patient token
    try {
      payload = authService.verifyAccessToken(token);
      tokenType = 'patient';
      console.log('✅ PATIENT TOKEN VERIFIED for video call');
    } catch (patientError: any) {
      console.log('⚠️ Patient token failed:', patientError.message);

      // Step 2: Try Doctor token
      try {
        payload = authService.verifyDoctorAccessToken(token);
        tokenType = 'doctor';
        console.log('✅ DOCTOR TOKEN VERIFIED for video call');
      } catch (doctorError: any) {
        console.error('❌ Both patient and doctor tokens failed');
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token',
        });
      }
    }

    // Ensure payload was extracted
    if (!payload) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload',
      });
    }

    // Validate role is either doctor or patient
    if (payload.role !== 'doctor' && payload.role !== 'patient') {
      console.error('❌ Invalid role for video call:', payload.role);
      return res.status(403).json({
        success: false,
        message: `Access denied: role "${payload.role}" not allowed for video calls`,
      });
    }

    // Safety: Ensure token type matches claimed role
    if (tokenType === 'patient' && payload.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Token-role mismatch (patient token used for non-patient)',
      });
    }
    if (tokenType === 'doctor' && payload.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Token-role mismatch (doctor token used for non-doctor)',
      });
    }

    // Attach authenticated user to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role as 'doctor' | 'patient',
    };

    console.log(
      `✅ VIDEO CALL AUTH SUCCESS: ${req.user.name} (${req.user.role}) - ID: ${req.user.userId}`
    );
    console.log('===================================\n');

    next();
  } catch (error: any) {
    console.error('❌ Video call auth middleware error:', error);

    if (error.message?.toLowerCase().includes('expired') || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Video call authentication failed',
      error: error.message,
    });
  }
};