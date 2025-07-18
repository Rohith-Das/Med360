import { Admin } from "../entities/admin.entity";

export interface IAdminRepository{
    create(admin:Admin):Promise<Admin>;
    findByEmail(email:string):Promise<Admin|null>
      findById(id: string): Promise<Admin | null>;
  update(id: string, adminData: Partial<Admin>): Promise<Admin>;
}