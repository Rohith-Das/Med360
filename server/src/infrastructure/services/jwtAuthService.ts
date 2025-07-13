import { sign, verify } from "jsonwebtoken";
import { injectable } from "tsyringe";
import { TokenPayload } from "../../shared/AuthType";
import { AuthService } from "../../application/service/AuthService";

@injectable()
export class JwtAuthService implements AuthService{
     private accessSecret: string;
    private refreshSecret: string;
    
    constructor(){
        this.accessSecret = process.env.JWT_SECRET!;
        this.refreshSecret = process.env.JWT_REFRESH_SECRET!;
        if (!this.accessSecret || !this.refreshSecret) {
            throw new Error("JWT_SECRET and JWT_REFRESH_SECRET must be defined");
        }
    }
     generateAccessToken(payload: TokenPayload): string {
        return sign(payload, this.accessSecret, { expiresIn: "15m" });
    }

    generateRefreshToken(payload: TokenPayload): string {
        return sign(payload, this.refreshSecret, { expiresIn: "7d" });
    }

    verifyAccessToken(token: string): TokenPayload {
        return verify(token, this.accessSecret) as TokenPayload;
    }

    verifyRefreshToken(token: string): TokenPayload {
        return verify(token, this.refreshSecret) as TokenPayload;
    }
}


