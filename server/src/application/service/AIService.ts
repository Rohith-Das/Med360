import { AiChatMessage } from "../../domain/entities/AiChatMessage.entity";

export interface AIService{
    generateResponse(messages:AiChatMessage[]):Promise<string>
}