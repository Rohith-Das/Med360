import { Specialization } from "../entities/specialization.entity";

export interface ISpecializationRepository {
    create(specialization:Specialization):Promise<Specialization>;
    findById(id:string):Promise<Specialization|null>;
    findAll(search?:string):Promise<Specialization[]>;
    update(id:string,updates:Partial<Specialization>):Promise<Specialization|null>;
    delete(id:string):Promise<boolean>;
}