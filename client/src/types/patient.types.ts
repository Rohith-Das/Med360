// src/types/patient.types.ts
export interface Patient {
  id: string;
  name: string;
  email: string;
  mobile: string;
  gender?: 'male' | 'female';
  dateOfBirth?: string;
  address?: string;
  isVerified: boolean;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export type AuthStatus = "idle" | "loading" | "succeeded" | "failed";

export interface AuthState {
  patient: Patient | null;
  accessToken: string | null;
  status: AuthStatus;
  error: string | null;
}