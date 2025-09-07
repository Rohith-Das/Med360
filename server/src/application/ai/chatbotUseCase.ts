import { injectable,inject } from "tsyringe";
import { AIService } from "../service/AIService";
import { AiChatMessage } from "../../domain/entities/AiChatMessage.entity";

@injectable()
export class ChatBotUC{
    constructor(
        @inject('AIService')private aiSerive:AIService
    ){}
    async execute(messages:AiChatMessage[]):Promise<string>{
        if(messages.length ===0 || messages[messages.length-1].sender !=='user'){
            throw new Error('invalid message history')
        }
        const response=await this.aiSerive.generateResponse(messages)
       return `${response}\n\n*Note: This is AI-generated information and not a substitute for professional medical advice. Please consult a doctor for personalized guidance.*`;
    }
}