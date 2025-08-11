import { injectable,inject } from "tsyringe";
import { ISpecializationRepository } from "../../../../domain/repositories/specializationRepository-method";
import { Specialization } from "../../../../domain/entities/specialization.entity";

@injectable()
export class getSpecializationsUC{
    constructor(
        @inject("ISpecializationRepository")private repo:ISpecializationRepository,
    ){}
    async execute(search?:string):Promise<Specialization[]>{
        return this.repo.findAll(search)
    }
}