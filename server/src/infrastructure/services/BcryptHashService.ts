import bcrypt from 'bcrypt'
import { injectable } from 'tsyringe'
import { HashService } from '../../application/service/HashService'

@injectable()
export class BcryptHashService implements HashService{
    private readonly saltRounds=10
    async hash(password:string):Promise<string>{
        return await bcrypt.hash(password,this.saltRounds)
    }
    async compare(password: string, hashed: string): Promise<boolean> {
        return await bcrypt.compare(password,hashed)
    }
}