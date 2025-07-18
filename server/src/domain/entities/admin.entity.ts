export interface Admin {
  id?: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin';
  refreshToken?: string;
  refreshTokenExpiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}