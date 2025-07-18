import { sign, verify } from "jsonwebtoken";
import { injectable } from "tsyringe";
import { TokenPayload } from "../../shared/AuthType";
import { AuthService } from "../../application/service/AuthService";

@injectable()
export class JwtAuthService implements AuthService{
     private accessSecret: string;
    private refreshSecret: string;
    //admin
    private adminAccessSecret: string;
  private adminRefreshSecret: string;
    
    constructor(){
        this.accessSecret = process.env.JWT_SECRET!;
        this.refreshSecret = process.env.JWT_REFRESH_SECRET!;
        this.adminAccessSecret = process.env.ADMIN_JWT_SECRET!;
        this.adminRefreshSecret = process.env.ADMIN_JWT_REFRESH_SECRET!;
        if (!this.accessSecret || !this.refreshSecret || !this.adminAccessSecret || !this.adminRefreshSecret) {
      throw new Error("All JWT secrets must be defined");
    }
    }
    //patient tokens
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
    //admin tokens
    generateAdminAccessToken(payload:TokenPayload):string{
        return sign(payload,this.adminAccessSecret,{expiresIn: "15m"})
    }
    generateAdminRefreshToken(payload: TokenPayload): string {
    return sign(payload, this.adminRefreshSecret, { expiresIn: "7d" });
  }

  verifyAdminAccessToken(token: string): TokenPayload {
    return verify(token, this.adminAccessSecret) as TokenPayload;
  }

  verifyAdminRefreshToken(token: string): TokenPayload {
    return verify(token, this.adminRefreshSecret) as TokenPayload;
  }
}


