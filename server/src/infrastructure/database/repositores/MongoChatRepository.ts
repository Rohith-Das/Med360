import { injectable } from 'tsyringe';
import { IChatRepository } from '../../../domain/repositories/ChatRepository';
import { ChatRoom } from '../../../domain/entities/ChatRoom.entity';
import { ChatMessage } from '../../../domain/entities/ChatMessage.entity';
import { ChatRoomModel } from '../models/ChatRoomModel';
import { ChatMessageModel } from '../models/ChatMessage';
import { DoctorModel } from '../models/DoctorModel';
import { PatientModel } from '../models/patient.model';
import { SpecializationModel } from '../models/specialization.model';
@injectable()
export class MongoChatRepository implements IChatRepository {
  
  async createChatRoom(data: Omit<ChatRoom, 'id'>): Promise<ChatRoom> {
    const chatRoom = new ChatRoomModel(data);
    const saved = await chatRoom.save();
    return {
      id: saved._id.toString(),
      ...saved.toObject()
    };
  }

  async findChatRoom(doctorId: string, patientId: string): Promise<ChatRoom | null> {
    const room = await ChatRoomModel.findOne({ doctorId, patientId })
      .populate('doctorId', 'name specialization profilePicture')
      .populate('patientId', 'name profilePicture')
      .lean();
    
    if (!room) return null;
    
    return {
      id: room._id.toString(),
      ...room
    };
  }

  async findChatRoomById(roomId: string): Promise<ChatRoom | null> {
    const room = await ChatRoomModel.findById(roomId)
      .populate('doctorId', 'name specialization profilePicture')
      .populate('patientId', 'name profilePicture')
      .lean();
    
    if (!room) return null;
    
    return {
      id: room._id.toString(),
      ...room
    };
  }

  async updateChatRoom(roomId: string, updates: Partial<ChatRoom>): Promise<ChatRoom | null> {
    const updated = await ChatRoomModel.findByIdAndUpdate(
      roomId,
      updates,
      { new: true }
    )
      .populate('doctorId', 'name specialization profilePicture')
      .populate('patientId', 'name profilePicture')
      .lean();
    
    if (!updated) return null;
    
    return {
      id: updated._id.toString(),
      ...updated
    };
  }

  async deleteChatRoom(roomId: string): Promise<boolean> {
    const result = await ChatRoomModel.findByIdAndDelete(roomId);
    return !!result;
  }

  async getDoctorChatRooms(doctorId: string, limit = 50, offset = 0): Promise<ChatRoom[]> {
    const rooms = await ChatRoomModel.find({ doctorId })
      .populate('patientId', 'name profilePicture')
      .sort({ 'lastMessage.timestamp': -1 })
      .limit(limit)
      .skip(offset)
      .lean();
    
    return rooms.map(room => ({
      id: room._id.toString(),
      ...room
    }));
  }

  async getPatientChatRooms(patientId: string, limit = 50, offset = 0): Promise<ChatRoom[]> {
    const rooms = await ChatRoomModel.find({ patientId })
      .populate('doctorId', 'name specialization profilePicture')
      .populate('patientId', 'name profilePicture')
      .sort({ 'lastMessage.timestamp': -1 })
      .limit(limit)
      .skip(offset)
      .lean();
    
    return rooms.map(room => ({
      id: room._id.toString(),
      ...room
    }));
  }

async createMessage(data: Omit<ChatMessage, 'id'>): Promise<ChatMessage> {
  const message = new ChatMessageModel({
    ...data,
    timestamp: data.timestamp ?? new Date(), // ← ensure always set
    readBy: data.readBy ?? undefined,
    status: data.status ?? 'sent',
  });

  const saved = await message.save();

  // Update chat room's lastMessage
  await ChatRoomModel.findByIdAndUpdate(data.chatRoomId, {
    lastMessage: {
      text: data.message,
      timestamp: data.timestamp ?? new Date(),
      senderType: data.senderType,
    },
  });

  return {
    id: saved._id.toString(),
    ...saved.toObject(),
  };
}

  async findMessageById(messageId: string): Promise<ChatMessage | null> {
    const message = await ChatMessageModel.findById(messageId).lean();
    if (!message) return null;
    
    return {
      id: message._id.toString(),
      ...message
    };
  }

  async updateMessage(messageId: string, updates: Partial<ChatMessage>): Promise<ChatMessage | null> {
    const updated = await ChatMessageModel.findByIdAndUpdate(
      messageId,
      updates,
      { new: true }
    ).lean();
    
    if (!updated) return null;
    
    return {
      id: updated._id.toString(),
      ...updated
    };
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    const result = await ChatMessageModel.findByIdAndDelete(messageId);
    return !!result;
  }

  async getChatRoomMessages(roomId: string, limit = 50, offset = 0): Promise<ChatMessage[]> {
  const messages = await ChatMessageModel.find({ chatRoomId: roomId })
    .populate('sender', 'name')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset)
    .lean();

  return messages.map((msg: any) => ({
    id: msg._id.toString(),
    chatRoomId: msg.chatRoomId.toString(),
    senderId: msg.sender?._id?.toString() ?? msg.senderId.toString(), // ← toString()
    senderName: msg.sender?.name ?? 'Unknown',
    senderType: msg.senderType,
    message: msg.message,
    messageType: msg.messageType,
    fileUrl: msg.fileUrl,
    fileName: msg.fileName,
    fileSize: msg.fileSize,
    isRead: msg.isRead,
    readBy: msg.readBy,
    status: msg.status,
    timestamp: msg.timestamp,
    createdAt: msg.createdAt,
    updatedAt: msg.updatedAt,
  })).reverse();
}

  async getUnreadMessages(roomId: string, userType: 'doctor' | 'patient'): Promise<ChatMessage[]> {
    const query: any = {
      chatRoomId: roomId,
      senderType: userType === 'doctor' ? 'patient' : 'doctor',
      isRead: false
    };
    
    const messages = await ChatMessageModel.find(query)
      .sort({ createdAt: 1 })
      .lean();
    
    return messages.map(msg => ({
      id: msg._id.toString(),
      ...msg
    }));
  }

  async markMessagesAsRead(roomId: string, userType: 'doctor' | 'patient'): Promise<number> {
    const updateField = userType === 'doctor' ? 'readBy.doctor' : 'readBy.patient';
    
    const result = await ChatMessageModel.updateMany(
      {
        chatRoomId: roomId,
        senderType: userType === 'doctor' ? 'patient' : 'doctor',
        [updateField]: { $exists: false }
      },
      {
        $set: {
          [updateField]: new Date(),
          isRead: true,
          status: 'seen'
        }
      }
    );
    
    return result.modifiedCount;
  }

  async markMessageAsRead(messageId: string, userType: 'doctor' | 'patient'): Promise<boolean> {
    const updateField = userType === 'doctor' ? 'readBy.doctor' : 'readBy.patient';
    
    const result = await ChatMessageModel.findByIdAndUpdate(
      messageId,
      {
        $set: {
          [updateField]: new Date(),
          isRead: true,
          status: 'seen'
        }
      }
    );
    
    return !!result;
  }

  async getUnreadCount(roomId: string, userType: 'doctor' | 'patient'): Promise<number> {
    const readField = userType === 'doctor' ? 'readBy.doctor' : 'readBy.patient';
    
    return await ChatMessageModel.countDocuments({
      chatRoomId: roomId,
      senderType: userType === 'doctor' ? 'patient' : 'doctor',
      [readField]: { $exists: false }
    });
  }

  async getAllUnreadCount(userId: string, userType: 'doctor' | 'patient'): Promise<number> {
    const roomField = userType === 'doctor' ? 'doctorId' : 'patientId';
    const rooms = await ChatRoomModel.find({ [roomField]: userId }).select('_id').lean();
    const roomIds = rooms.map(r => r._id.toString());
    
    if (roomIds.length === 0) return 0;
    
    const readField = userType === 'doctor' ? 'readBy.doctor' : 'readBy.patient';
    
    return await ChatMessageModel.countDocuments({
      chatRoomId: { $in: roomIds },
      senderType: userType === 'doctor' ? 'patient' : 'doctor',
      [readField]: { $exists: false }
    });
  }

async searchDoctors(query: string, limit = 20): Promise<any[]> {
  const matchSpeci=await SpecializationModel.find({
    name:{$regex:query,$options:'i'}
  }) .select('_id name').lean()

  const specializationIds=matchSpeci.map(s =>s._id);

  const doctors = await DoctorModel.find({
      isBlocked: false,
      status: 'approved',
     $or: [
      { name: { $regex: query, $options: 'i' } },
      { specialization: { $in: specializationIds } }
    ]
    })
      .populate('specialization', 'name') // ✅ get specialization name
      .select('name specialization profileImage')
      .limit(limit)
      .lean();

    // ✅ Return consistent structure for frontend
    return doctors.map((doc) => ({
      id: doc._id.toString(),
      name: doc.name,
      specialization:
        typeof doc.specialization === 'object'
          ? (doc.specialization as { name?: string })?.name || ''
          : '',
      profilePicture: doc.profileImage || ''
    }));
  }


  async searchPatients(query: string, limit = 20): Promise<any[]> {
    const patients = await PatientModel.find({
      isBlocked: false,
      name: { $regex: query, $options: 'i' }
    })
      .select('name profilePicture')
      .limit(limit)
      .lean();
    
    return patients.map(pat => ({
      id: pat._id.toString(),
     name: pat.name,
    profilePicture: pat.profilePicture || "",
    }));
  }
}