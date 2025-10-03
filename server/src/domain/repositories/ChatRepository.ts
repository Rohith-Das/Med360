import { ChatRoom ,CreateChatRoomInput } from "../entities/ChatRoom.entity";
import { ChatMessage,CreateMessageInput } from "../entities/ChatMessage.entity";

export interface IChatRepository{
  findChatRoom(doctorId:string,patientId:string):Promise<ChatRoom|null>;
  createChatRoom(input:CreateChatRoomInput):Promise<ChatRoom>;
  updateChatRoomExpiry(chatRoomId:string,expiresAt:Date):Promise<ChatRoom>;
  getChatRoomById(chatRoomId:string):Promise<ChatRoom|null>
  updateLastAppointmentDate(chatRoomId:string,appointmentDate:Date):Promise<ChatRoom>;

  createMessage(input:CreateMessageInput):Promise<ChatMessage>
  getMessages(chatRoomId:string,limit?:number,skip?:number):Promise<ChatMessage[]>;
  markMessagesAsRead(chatRoomId:string,readerId:string,readerType:'doctor'|'patient'):Promise<number>
  getUnreadCount(chatRoomId: string, userId: string, userType: 'doctor' | 'patient'): Promise<number>;

    canAccessChat(chatRoomId: string, userId: string, userType: 'doctor' | 'patient'): Promise<boolean>;
  isChatActive(chatRoomId: string): Promise<boolean>;
  
  // Utility Methods
  getUserChatRooms(userId: string, userType: 'doctor' | 'patient'): Promise<ChatRoom[]>;
  getChatRoomParticipants(chatRoomId: string): Promise<{ doctorId: string; patientId: string }>;



}
