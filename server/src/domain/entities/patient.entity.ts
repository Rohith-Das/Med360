export interface Patient {
  id?: string;
  name: string;
  mobile: string;
  email: string;
  password?: string;
  isVerified: boolean;
  otp?: string;
  otpExpiresAt?: Date;
  refreshToken?: string;
  refreshTokenExpiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  role: 'patient' | 'doctor' | 'admin';
}
