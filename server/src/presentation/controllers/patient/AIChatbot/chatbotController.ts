import { Request,Response } from "express";
import { container } from "tsyringe";
import { ChatBotUC } from "../../../../application/ai/chatbotUseCase";
import { AuthRequest } from "../../../middlewares/AuthRequest";
import { AiChatMessage } from "../../../../domain/entities/AiChatMessage.entity";
import { success } from "zod";

export const chatbotController=async(req:AuthRequest,res:Response):Promise<Response>=>{
try {
    const patientId=req.user?.userId;
    if (!patientId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const {messages}=req.body as {messages:AiChatMessage[]};
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid messages" });
    }
    const useCase=container.resolve(ChatBotUC)
    const response=await useCase.execute(messages)

    return res.status(200).json({
        success:true,
        response,
    })
} catch (error:any) {
   console.error("Chatbot error:", error.message);
    return res.status(500).json({ success: false, message: error.message || "Failed to get response" }); 
}
}