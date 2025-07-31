import { inject,injectable } from "tsyringe";
import { IAdminRepository } from "../../../../domain/repositories/adminRepository-method";
import { HashService } from "../../../service/HashService";
import { AuthService } from "../../../service/AuthService";

@injectable()
export class AdminLoginUC{
    constructor(@inject("IAdminRepository")private repo:IAdminRepository,
                @inject("HashService")private hashed:HashService,
                @inject("AuthService")private authServer:AuthService
            ){}
    async execute({email,password}:{email:string;password:string}){
        const admin=await this.repo.findByEmail(email)
        if (!admin || !admin.password) {
      throw new Error("Invalid credentials");
    }
    const isMatch = await this.hashed.compare(password, admin.password);
    if (!isMatch) {
      throw new Error("Invalid credentials");
    }

    const payload={
        userId:admin.id!,
        email:admin.email,
        name:admin.name,
        role:admin.role,
    }
    const adminRefreshToken=this.authServer.generateAdminRefreshToken(payload);
    const adminAccessToken=this.authServer.generateAdminAccessToken(payload)

    await this.repo.update(admin.id!,{
        refreshToken:adminRefreshToken,
        refreshTokenExpiresAt:new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    return {
        adminAccessToken,
        adminRefreshToken,
        admin:{
            id:admin.id!,
            name:admin.name,
            email:admin.email,
            role:admin.role,
        }
    }
    }

}






