import { injectable,inject } from "tsyringe";       
import { IAppointmentRepository } from "../../domain/repositories/AppointmentRepository";
import { IChatRepository } from "../../domain/repositories/ChatRepository";

@injectable()

export class SearchUsersUC{
    constructor(@inject('IChatRepository')private chatRepo:IChatRepository){}

    async execute(query :string,searchType:'doctors'|'patients',limit=20):Promise<any[]>{
        if(!query  || query.trim().length===0){
            return []
        }
        let results:any[];
        if(searchType==='doctors'){
            results=await this.chatRepo.searchDoctors(query,limit);
        }else{
            results=await this.chatRepo.searchPatients(query,limit)
        }
        console.log(`✅ Found ${results.length} ${searchType} matching "${query}"`);
    return results;
    }
}