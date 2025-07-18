import { injectable,inject } from "tsyringe";
import { AuthService } from "../../service/AuthService";
import { TokenPayload } from "../../../shared/AuthType";

@injectable()
export class AdminRefreshTokenUC{
    constructor(@inject('AuthService')private authService:AuthService){}
    async execute(refreshToken:string):Promise<string>{
        let payload:TokenPayload;

        try {
            payload=this.authService.verifyAdminRefreshToken(refreshToken)
        } catch (error) {
            throw new Error('Invalid or expired refresh token');
        }
        return this.authService.generateAdminAccessToken({
            userId:payload.userId,
            email:payload.email,
            name:payload.name,
            role:payload.role,
        })
    }
}