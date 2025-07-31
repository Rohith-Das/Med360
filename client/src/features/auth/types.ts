// features/auth/types.ts - Create this new file
export interface Patient {
  id: string;
  name: string;
  email: string;
  mobile: string;
  gender?: 'male' | 'female';
  dateOfBirth?: string;
  isVerified: boolean;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  patient: Patient | null;
  accessToken: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}