import { injectable,inject } from "tsyringe";
import { IPatientRepository } from "../../../../domain/repositories/patientRepository_method";

@injectable()
export class GetAllPtientsUC{
    constructor(@inject("IPatientRepository")private repo:IPatientRepository){}

    async execute(params:{
        page?:number;
        limit?:number;
        isBlocked?:boolean;
        isDeleted?:boolean;
        searchTerm?:string ;
    }){
        const {page=1,limit=10,isBlocked,isDeleted,searchTerm}=params;
        return await this.repo.findAll(page,limit,{
            isBlocked,isDeleted,searchTerm
        });
    }
}