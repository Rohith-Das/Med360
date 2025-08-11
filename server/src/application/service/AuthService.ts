import { TokenPayload } from "../../shared/AuthType";

export interface AuthService {
    //patient tokens
    generateAccessToken(payload: TokenPayload): string;
    generateRefreshToken(payload: TokenPayload): string;
    verifyAccessToken(token: string): TokenPayload;
    verifyRefreshToken(token: string): TokenPayload;
    //admin tokens
     generateAdminAccessToken(payload: TokenPayload): string;
  generateAdminRefreshToken(payload: TokenPayload): string;
  verifyAdminAccessToken(token: string): TokenPayload;
  verifyAdminRefreshToken(token: string): TokenPayload;

       generateDoctorAccessToken(payload: TokenPayload): string;
  generateDoctorRefreshToken(payload: TokenPayload): string;
  verifyDoctorAccessToken(token: string): TokenPayload;
  verifyDoctorRefreshToken(token: string): TokenPayload;
}
