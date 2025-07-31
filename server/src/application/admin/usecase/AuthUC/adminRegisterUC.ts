import { injectable,inject } from "tsyringe";
import { IAdminRepository } from "../../../../domain/repositories/adminRepository-method";
import { HashService } from "../../../service/HashService";
import { Admin } from "../../../../domain/entities/admin.entity";

@injectable()
export class AdminRegisterUC{
    constructor(
    @inject("IAdminRepository") private repo: IAdminRepository,
    @inject("HashService") private hashService: HashService
  ) {}
    async execute(adminData: { name: string; email: string; password: string }): Promise<Admin> {
        const existingAdmin=await this.repo.findByEmail(adminData.email);
        if(existingAdmin){
            throw new Error("admin already exists")
        }
        const hashPassword=await this.hashService.hash(adminData.password);

        const admin:Admin={
            name:adminData.name,
            email:adminData.email,
            password:hashPassword,
            role:"admin",
        }
        return await this.repo.create(admin)

    }

}