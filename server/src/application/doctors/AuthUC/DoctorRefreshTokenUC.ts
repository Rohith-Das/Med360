import { injectable,inject } from "tsyringe";
import { AuthService } from "../../service/AuthService";
import { TokenPayload } from "../../../shared/AuthType";
@injectable()
export class doctorRefereshTokenUc{
    constructor(
        @inject('AuthService')private authService:AuthService
    ){}

    async execute(refreshToken:string):Promise<string>{
        let payload:TokenPayload;

        try {
            payload=this.authService.verifyDoctorRefreshToken(refreshToken)
        } catch (error) {
        throw new Error('Invalid or expired refresh token');
        }

        return this.authService.generateDoctorAccessToken({
            userId:payload.userId,
            email:payload.email,
            name:payload.name,
            role:payload.role,
        })
    }
}