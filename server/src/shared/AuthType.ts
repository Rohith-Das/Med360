

export interface TokenPayload {
    userId: string;
    email: string;
    name: string;
    role: 'patient' | 'doctor' | 'admin';
}