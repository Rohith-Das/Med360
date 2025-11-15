import { injectable,inject } from "tsyringe";       
import { IAppointmentRepository } from "../../domain/repositories/AppointmentRepository";
import { IChatRepository } from "../../domain/repositories/ChatRepository";

@injectable()
export class SearchUsersUC {
  constructor(@inject('IChatRepository') private chatRepo: IChatRepository) {}

  async execute(query: string, searchType: 'doctors' | 'patients', limit = 20): Promise<any[]> {
    console.log('🔍 === SEARCH USE CASE DEBUG ===');
    console.log('Query:', query);
    console.log('Search Type:', searchType);
    console.log('Limit:', limit);

    if (!query || query.trim().length === 0) {
      console.log('⚠️ Empty query, returning empty array');
      return [];
    }

    let results: any[];
    
    if (searchType === 'doctors') {
      console.log('🏥 Calling searchDoctors repository method');
      results = await this.chatRepo.searchDoctors(query, limit);
    } else {
      console.log('🧑‍⚕️ Calling searchPatients repository method');
      results = await this.chatRepo.searchPatients(query, limit);
    }

    console.log(`✅ Repository returned ${results.length} ${searchType}`);
    console.log('Sample result:', results[0]);
    console.log('=========================\n');
    
    return results;
  }
}
