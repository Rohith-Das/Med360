import mongoose from "mongoose";
import { injectable } from "tsyringe";

@injectable()

export class mongoDBClient{
    async connect():Promise<void>{
        try {
            await mongoose.connect(process.env.MONGO_URI as string);
            console.log('✅ Connected to MongoDB');
        } catch (error) {
            console.error('❌ Error connecting to MongoDB:', error);
            process.exit(1);
        }
    }
}