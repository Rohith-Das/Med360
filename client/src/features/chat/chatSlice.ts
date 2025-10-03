import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";
import doctorAxiosInstance from "@/api/doctorAxiosInstance";

export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderType: 'doctor' | 'patient';
  receiverId: string;
  receiverType: 'doctor' | 'patient';
  message: string;
  messageType: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatRoom {
  id: string;
  chatRoomId: string;
  patientId: string;
  doctorId: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCountPatient: number;
  unreadCountDoctor: number;
  lastAppointmentDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  patientName?:string;
  doctorName?:string;
}

interface ChatState {
  chatRooms: ChatRoom[];
  currentChatMessages: ChatMessage[];
  currentChatRoomId: string | null;
  loading: boolean;
  sendingMessage: boolean;
  error: string | null;
  hasMoreMessages: boolean;
  currentPage: number;
  typingUsers: string[];
  onlineUsers: string[];
  unreadCounts: Record<string, number>;
}

const initialState: ChatState = {
  chatRooms: [],
  currentChatMessages: [],
  currentChatRoomId: null,
  loading: false,
  sendingMessage: false,
  error: null,
  hasMoreMessages: true,
  currentPage: 1,
  typingUsers: [],
  onlineUsers: [],
  unreadCounts: {},
};

// Async thunks
export const fetchChatRooms = createAsyncThunk(
  'chat/fetchChatRooms',
  async (role: 'doctor' | 'patient') => {
    const api = role === 'patient' ? axiosInstance : doctorAxiosInstance;
    const response = await api.get(`/${role}/chat/rooms`);
    return response.data.data;
  }
);

export const fetchChatMessages = createAsyncThunk(
  'chat/fetchChatMessages',
  async ({
    participantId,
    role,
    page = 1,
    limit = 50
  }: {
    participantId: string;
    role: 'doctor' | 'patient';
    page?: number;
    limit?: number;
  }) => {
    const api = role === 'patient' ? axiosInstance : doctorAxiosInstance;
    const response = await api.get(`/${role}/chat/${participantId}/messages`, {
      params: { page, limit }
    });
    return { ...response.data.data, page };
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({
    participantId,
    message,
    messageType = 'text',
    fileUrl,
    fileName,
    fileSize,
    role
  }: {
    participantId: string;
    message: string;
    messageType?: 'text' | 'image' | 'file';
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    role: 'doctor' | 'patient';
  }) => {
    const api = role === 'patient' ? axiosInstance : doctorAxiosInstance;
    const response = await api.post(`/${role}/chat/${participantId}/messages`, {
      message,
      messageType,
      fileUrl,
      fileName,
      fileSize
    });
    return response.data.data;
  }
);

export const markMessagesAsRead = createAsyncThunk(
  'chat/markMessagesAsRead',
  async ({ participantId, role, userId }: { participantId: string; role: 'doctor' | 'patient'; userId?: string }) => {
    const api = role === 'patient' ? axiosInstance : doctorAxiosInstance;
    await api.put(`/${role}/chat/${participantId}/read`);
    return { participantId, userId };
  }
);

export const uploadChatFile = createAsyncThunk(
  'chat/uploadChatFile',
  async ({
    participantId,
    file,
    role
  }: {
    participantId: string;
    file: File;
    role: 'doctor' | 'patient';
  }) => {
    const api = role === 'patient' ? axiosInstance : doctorAxiosInstance;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('message', `Sent a file: ${file.name}`);
    formData.append('messageType', file.type.startsWith('image/') ? 'image' : 'file');

    const response = await api.post(`/${role}/chat/${participantId}/messages/file`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setCurrentChatRoom: (state, action: PayloadAction<string>) => {
      state.currentChatRoomId = action.payload;
      state.currentChatMessages = [];
      state.currentPage = 1;
      state.hasMoreMessages = true;
        const selectedRoom = state.chatRooms.find(room => room.chatRoomId === action.payload);
  console.log("Current chat room:", selectedRoom);

    },
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      const message = action.payload;

      // Check if message already exists
      const exists = state.currentChatMessages.find(m => m.id === message.id);
      if (!exists) {
        state.currentChatMessages.push(message);
      }

      // Update chat room last message
      const chatRoom = state.chatRooms.find(room => room.chatRoomId === message.chatRoomId);
      if (chatRoom) {
        chatRoom.lastMessage = message.message;
        chatRoom.lastMessageAt = message.createdAt;
  console.log("Updated chat room after new message:", chatRoom);
        // Update unread count
        if (message.senderType === 'doctor') {
          chatRoom.unreadCountPatient += 1;
        } else {
          chatRoom.unreadCountDoctor += 1;
        }
      }
    },
    addRealtimeMessage: (state, action: PayloadAction<any>) => {
      const messageData = action.payload;
      const tempMessage: ChatMessage = {
        id: messageData.messageId,
        chatRoomId: messageData.chatRoomId,
        senderId: messageData.senderId,
        senderType: messageData.senderRole,
        receiverId: '', // Will be filled by backend
        receiverType: messageData.senderRole === 'doctor' ? 'patient' : 'doctor',
        message: messageData.message,
        messageType: messageData.messageType || 'text',
        fileUrl: messageData.fileUrl,
        fileName: messageData.fileName,
        isRead: false,
        createdAt: messageData.timestamp,
        updatedAt: messageData.timestamp
      };

      if (state.currentChatRoomId === messageData.chatRoomId) {
        state.currentChatMessages.push(tempMessage);
      }
    },
    updateTypingUsers: (state, action: PayloadAction<{ userId: string; isTyping: boolean }>) => {
      const { userId, isTyping } = action.payload;
      if (isTyping) {
        if (!state.typingUsers.includes(userId)) {
          state.typingUsers.push(userId);
        }
      } else {
        state.typingUsers = state.typingUsers.filter(id => id !== userId);
      }
    },
    updateOnlineUsers: (state, action: PayloadAction<{ userId: string; isOnline: boolean }>) => {
      const { userId, isOnline } = action.payload;
      if (isOnline) {
        if (!state.onlineUsers.includes(userId)) {
          state.onlineUsers.push(userId);
        }
      } else {
        state.onlineUsers = state.onlineUsers.filter(id => id !== userId);
      }
    },
    markMessagesRead: (state, action: PayloadAction<{ chatRoomId: string; userId: string }>) => {
      const { chatRoomId, userId } = action.payload;

      // Mark messages as read in current chat
      if (state.currentChatRoomId === chatRoomId) {
        state.currentChatMessages.forEach(message => {
          if (message.receiverId === userId && !message.isRead) {
            message.isRead = true;
            message.readAt = new Date().toISOString();
          }
        });
      }

      // Reset unread count in chat room
      const chatRoom = state.chatRooms.find(room => room.chatRoomId === chatRoomId);
      if (chatRoom) {
        chatRoom.unreadCountPatient = 0;
        chatRoom.unreadCountDoctor = 0;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentChat: (state) => {
      state.currentChatRoomId = null;
      state.currentChatMessages = [];
      state.currentPage = 1;
      state.hasMoreMessages = true;
      state.typingUsers = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch chat rooms
      .addCase(fetchChatRooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatRooms.fulfilled, (state, action) => {
        state.loading = false;
        state.chatRooms = action.payload;
         console.log("Fetched chat rooms:", state.chatRooms);
      })
      .addCase(fetchChatRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch chat rooms';
      })
      // Fetch chat messages
      .addCase(fetchChatMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatMessages.fulfilled, (state, action) => {
        state.loading = false;
        const { messages, hasMore, page } = action.payload;

        if (page === 1) {
          state.currentChatMessages = messages;
        } else {
          // Prepend older messages
          state.currentChatMessages = [...messages, ...state.currentChatMessages];
        }

        state.hasMoreMessages = hasMore;
        state.currentPage = page;
      })
      .addCase(fetchChatMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch messages';
      })
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.sendingMessage = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sendingMessage = false;
        // Message will be added via real-time socket event or addMessage action
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sendingMessage = false;
        state.error = action.error.message || 'Failed to send message';
      })
      // Upload file
      .addCase(uploadChatFile.pending, (state) => {
        state.sendingMessage = true;
        state.error = null;
      })
      .addCase(uploadChatFile.fulfilled, (state, action) => {
        state.sendingMessage = false;
      })
      .addCase(uploadChatFile.rejected, (state, action) => {
        state.sendingMessage = false;
        state.error = action.error.message || 'Failed to upload file';
      })
      // Mark as read
      .addCase(markMessagesAsRead.fulfilled, (state, action) => {
        const { participantId } = action.payload;
        // Reset unread count
        const chatRoom = state.chatRooms.find(room => room.chatRoomId === participantId);
        if (chatRoom) {
          chatRoom.unreadCountPatient = 0;
          chatRoom.unreadCountDoctor = 0;
        }
      });
  },
});

export const {
  setCurrentChatRoom,
  addMessage,
  addRealtimeMessage,
  updateTypingUsers,
  updateOnlineUsers,
  markMessagesRead,
  clearError,
  clearCurrentChat
} = chatSlice.actions;

export default chatSlice.reducer;