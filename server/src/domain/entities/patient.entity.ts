export interface Patient {
    id?: string;
    name: string;
    mobile: string;
    email: string;
    password?: string;
    isVerified: boolean;
    otp?: string;
    otpExpiresAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}