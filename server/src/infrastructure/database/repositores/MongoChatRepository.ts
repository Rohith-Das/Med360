import { injectable } from "tsyringe";
import { IChatRepository } from "../../../domain/repositories/ChatRepository";
import { ChatRoom,CreateChatRoomInput } from "../../../domain/entities/ChatRoom.entity";
import { ChatMessage,CreateMessageInput } from "../../../domain/entities/ChatMessage.entity";
import { ChatRoomModel } from "../models/ChatRoomModel";
import { ChatMessageModel } from "../models/ChatMessage";

@injectable()

export class MongoChatRepository implements IChatRepository{
  async findChatRoom(doctorId: string, patientId: string): Promise<ChatRoom | null> {
    const chatRoom=await ChatRoomModel.findOne({doctorId,patientId});
    return chatRoom ? this.mapChatRoom(chatRoom):null
  }

async createChatRoom(input: CreateChatRoomInput): Promise<ChatRoom> {
  try {
    // Calculate expiry date (appointment date + 7 days)
    const expiresAt = new Date(input.lastAppointmentDate);
    expiresAt.setDate(expiresAt.getDate() + 7);

    const chatRoom = new ChatRoomModel({
      doctorId: input.doctorId,
      patientId: input.patientId,
      lastAppointmentDate: input.lastAppointmentDate,
      expiresAt: expiresAt,
      isActive: true,
    });

    const saved = await chatRoom.save();
    console.log(`Chat room created successfully: ${saved._id}`);
    return this.mapChatRoom(saved);
  } catch (error: any) {
    console.error('Error creating chat room:', error);
    
    // Handle duplicate key error (unique constraint violation)
    if (error.code === 11000) {
      throw new Error('Chat room already exists for this doctor-patient pair');
    }
    
    throw error;
  }
}

  async updateChatRoomExpiry(chatRoomId: string, expiresAt: Date): Promise<ChatRoom> {
    const updated = await ChatRoomModel.findByIdAndUpdate(
      chatRoomId,
      { expiresAt, isActive: true },
      { new: true }
    );
    
    if (!updated) throw new Error('Chat room not found');
    return this.mapChatRoom(updated);
  }

  async getChatRoomById(chatRoomId: string): Promise<ChatRoom | null> {
    const chatRoom = await ChatRoomModel.findById(chatRoomId);
    return chatRoom ? this.mapChatRoom(chatRoom) : null;
  }

async updateLastAppointmentDate(chatRoomId: string, appointmentDate: Date): Promise<ChatRoom> {
  try {
    // Calculate new expiry date (appointment date + 7 days)
    const expiresAt = new Date(appointmentDate);
    expiresAt.setDate(expiresAt.getDate() + 7);

    const updated = await ChatRoomModel.findByIdAndUpdate(
      chatRoomId,
      { 
        lastAppointmentDate: appointmentDate,
        expiresAt: expiresAt,
        isActive: true 
      },
      { new: true }
    );
    
    if (!updated) {
      throw new Error('Chat room not found for update');
    }
    
    return this.mapChatRoom(updated);
  } catch (error) {
    console.error('Error updating chat room appointment date:', error);
    throw error;
  }
}

  async createMessage(input: CreateMessageInput): Promise<ChatMessage> {
    const message = new ChatMessageModel({
      chatRoomId: input.chatRoomId,
      senderId: input.senderId,
      senderType: input.senderType,
      message: input.message,
      messageType: input.messageType,
      fileUrl: input.fileUrl,
      fileName: input.fileName,
      fileSize: input.fileSize,
      isRead: false,
    });

    const saved = await message.save();
    
    // Update chat room's updatedAt timestamp
    await ChatRoomModel.findByIdAndUpdate(input.chatRoomId, { updatedAt: new Date() });
    
    return this.mapChatMessage(saved);
  }

  async getMessages(chatRoomId: string, limit: number = 50, skip: number = 0): Promise<ChatMessage[]> {
    const messages = await ChatMessageModel.find({ chatRoomId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return messages.map(msg => this.mapChatMessage(msg));
  }

  async markMessagesAsRead(chatRoomId: string, readerId: string, readerType: 'doctor' | 'patient'): Promise<number> {
    const readField = readerType === 'doctor' ? 'readBy.doctor' : 'readBy.patient';
    
    const result = await ChatMessageModel.updateMany(
      { 
        chatRoomId, 
        senderId: { $ne: readerId },
        [readField]: { $exists: false }
      },
      { 
        [readField]: new Date(),
        $set: { isRead: true }
      }
    );

    return result.modifiedCount;
  }

  async getUnreadCount(chatRoomId: string, userId: string, userType: 'doctor' | 'patient'): Promise<number> {
    const readField = userType === 'doctor' ? 'readBy.doctor' : 'readBy.patient';
    
    return await ChatMessageModel.countDocuments({
      chatRoomId,
      senderId: { $ne: userId },
      [readField]: { $exists: false }
    });
  }

  async canAccessChat(chatRoomId: string, userId: string, userType: 'doctor' | 'patient'): Promise<boolean> {
    const chatRoom = await ChatRoomModel.findById(chatRoomId);
    if (!chatRoom) return false;

    if (userType === 'doctor') {
      return chatRoom.doctorId.toString() === userId;
    } else {
      return chatRoom.patientId.toString() === userId;
    }
  }

  async isChatActive(chatRoomId: string): Promise<boolean> {
    const chatRoom = await ChatRoomModel.findOne({
      _id: chatRoomId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });
    
    return !!chatRoom;
  }

  async getUserChatRooms(userId: string, userType: 'doctor' | 'patient'): Promise<ChatRoom[]> {
    const query = userType === 'doctor' ? { doctorId: userId } : { patientId: userId };
    
    const chatRooms = await ChatRoomModel.find(query)
      .populate(userType === 'doctor' ? 'patientId' : 'doctorId')
      .sort({ updatedAt: -1 });

    return chatRooms.map(room => this.mapChatRoom(room));
  }

  async getChatRoomParticipants(chatRoomId: string): Promise<{ doctorId: string; patientId: string }> {
    const chatRoom = await ChatRoomModel.findById(chatRoomId);
    if (!chatRoom) throw new Error('Chat room not found');

    return {
      doctorId: chatRoom.doctorId.toString(),
      patientId: chatRoom.patientId.toString()
    };
  }


  private mapChatRoom(doc:any):ChatRoom{
    return{
      id:doc._id.toString(),
      doctorId:doc.toString(),
      patientId: doc.patientId.toString(),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      expiresAt: doc.expiresAt,
      isActive: doc.isActive,
      lastAppointmentDate: doc.lastAppointmentDate,
    }
  }
   private mapChatMessage(doc: any): ChatMessage {
    return {
      id: doc._id.toString(),
      chatRoomId: doc.chatRoomId.toString(),
      senderId: doc.senderId,
      senderType: doc.senderType,
      message: doc.message,
      messageType: doc.messageType,
      fileUrl: doc.fileUrl,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      isRead: doc.isRead,
      readBy: doc.readBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}