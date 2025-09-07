import { injectable } from "tsyringe";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIService } from "../../application/service/AIService";
import { AiChatMessage } from "../../domain/entities/AiChatMessage.entity";

@injectable()
export class GeminiService implements AIService{
    private genAI: GoogleGenerativeAI;
    private model: any; 

    constructor(){
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not defined in environment variables");
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({model: "gemini-1.5-flash"});
    }

    async generateResponse(messages: AiChatMessage[]): Promise<string> {
        try {
            const validHistory=messages.filter((msg,index)=>{
                if(index===messages.length-1) return true;
                return msg.sender==='user';
            })

              const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender !== 'user') {
        throw new Error("Last message must be from user");
      }
            
 const history = validHistory.slice(0, -1).map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      }));
      
            const chat = this.model.startChat({
                history,
                generationConfig: { 
                    maxOutputTokens: 500,
                    temperature: 0.7,
                },
            });

        
            const result = await chat.sendMessage(lastMessage.text);
            const response = result.response;
            return response.text();
        } catch (error: any) {
            console.error("Gemini API Error:", error);
            throw new Error("Failed to generate response. Please try again.");
        }
    }
}