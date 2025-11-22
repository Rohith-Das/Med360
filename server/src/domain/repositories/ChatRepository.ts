import { ChatRoom  } from "../entities/ChatRoom.entity";
import { ChatMessage } from "../entities/ChatMessage.entity";


export interface IChatRepository {
  // ChatRoom operations
  createChatRoom(data: Omit<ChatRoom, 'id'>): Promise<ChatRoom>;
  findChatRoom(doctorId: string, patientId: string): Promise<ChatRoom | null>;
  findChatRoomById(roomId: string): Promise<ChatRoom | null>;
  updateChatRoom(roomId: string, updates: Partial<ChatRoom>): Promise<ChatRoom | null>;
  deleteChatRoom(roomId: string): Promise<boolean>;
  
  getDoctorChatRooms(doctorId: string, limit?: number, offset?: number): Promise<ChatRoom[]>;
  getPatientChatRooms(patientId: string, limit?: number, offset?: number): Promise<ChatRoom[]>;
  
  createMessage(data: Omit<ChatMessage, 'id'>): Promise<ChatMessage>;
  findMessageById(messageId: string): Promise<ChatMessage | null>;
  updateMessage(messageId: string, updates: Partial<ChatMessage>): Promise<ChatMessage | null>;
  deleteMessage(messageId: string): Promise<boolean>;
  getChatRoomMessages(roomId: string, limit?: number, offset?: number): Promise<ChatMessage[]>;
  getUnreadMessages(roomId: string, userType: 'doctor' | 'patient'): Promise<ChatMessage[]>;
  
  markMessagesAsRead(roomId: string, userType: 'doctor' | 'patient'): Promise<number>;
  markMessageAsRead(messageId: string, userType: 'doctor' | 'patient'): Promise<boolean>;
  

  getUnreadCount(roomId: string, userType: 'doctor' | 'patient'): Promise<number>;
  getAllUnreadCount(userId: string, userType: 'doctor' | 'patient'): Promise<number>;
  
  // Search
  searchDoctors(query: string, limit?: number): Promise<any[]>;
  searchPatients(query: string, limit?: number): Promise<any[]>;
}