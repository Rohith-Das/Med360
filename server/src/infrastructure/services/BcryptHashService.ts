import bcrypt from 'bcrypt'
import { injectable } from 'tsyringe'
import { HashService } from '../../application/service/HashService'

@injectable()
export class BcryptHashService implements HashService{
    private readonly saltRounds=10
    async hash(password: string): Promise<string> {
        // Validate input
        if (!password) {
            throw new Error("Password is required for hashing");
        }
        
        if (typeof password !== 'string') {
            throw new Error("Password must be a string");
        }
        
        if (password.trim().length === 0) {
            throw new Error("Password cannot be empty");
        }
        
        try {
            return await bcrypt.hash(password.trim(), this.saltRounds);
        } catch (error) {
            console.error("Bcrypt hash error:", error);
            throw new Error("Failed to hash password");
        }
    }
    async compare(password: string, hashed: string): Promise<boolean> {
        if (!password || !hashed) {
            throw new Error("Password and hash are required for comparison");
        }
        
        if (typeof password !== 'string' || typeof hashed !== 'string') {
            throw new Error("Password and hash must be strings");
        }
        
        try {
            return await bcrypt.compare(password.trim(), hashed);
        } catch (error) {
            console.error("Bcrypt compare error:", error);
            throw new Error("Failed to compare password");
        }
    }
}