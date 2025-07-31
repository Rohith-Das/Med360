export interface Patient {
  id?: string;
  name: string;
  mobile: string;
  email: string;
  password?: string;
   isBlocked: boolean;
  isDeleted: boolean;
  isVerified: boolean;
  otp?: string;
  otpExpiresAt?: Date;
  refreshToken?: string;
  refreshTokenExpiresAt?: Date;
  createdAt?: Date;
    gender?: 'male' | 'female';
  dateOfBirth?: string;
  address?: string;
   profilePicture?: string;
  updatedAt?: Date;
  role: 'patient' | 'doctor' | 'admin';
}
