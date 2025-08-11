import { Doctor } from "../entities/Doctor.entity";

export interface IDoctorRepository{
    create(doctor:Omit<Doctor,'id'>):Promise<Doctor>
    findById(id:string):Promise<Doctor|null>
    findByEmail(email:string):Promise<Doctor|null>
    update(id:string,updates:Partial<Doctor>):Promise<Doctor|null>
    delete(id:string):Promise<boolean>;
   findAll(query:{status?:string}):Promise<Doctor[]>
}