export interface AiChatMessage{
    id:string;
    text:string;
    sender:'user'|'bot';
    timestamp:Date;
}