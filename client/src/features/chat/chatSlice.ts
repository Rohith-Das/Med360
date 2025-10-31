import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import doctorAxiosInstance from "@/api/doctorAxiosInstance";
import axiosInstance from "@/api/axiosInstance";
import { RootState } from "@/app/store";


export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderName?: string;
  senderType: "doctor" | "patient";
  messageType: "text" | "image" | "file";
  message: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead: boolean;
  readBy?: {
    doctor?: Date;
    patient?: Date;
  };
  status: "sent" | "delivered" | "seen";
  timestamp?: Date;
  createdAt: string;
  updatedAt: string;
}

export interface ChatRoom {
  id: string;
  doctorId: string;
  patientId: string;
  lastAppointmentDate: Date;
  lastMessage?: {
    text: string;
    timestamp: Date;
    senderType: "doctor" | "patient";
  };
  createdAt: string;
  updatedAt: string;
}

export interface ChatUser {
  id: string;
  name: string;
  profilePicture?: string;
  specialization?: string;
}

interface TypingStatus {
  roomId: string;
  userId: string;
  userName: string;
  userRole: 'doctor' | 'patient';
  isTyping: boolean;
}

interface ChatState {
  chatRooms: ChatRoom[];
  messages: Record<string, ChatMessage[]>;
  currentRoomId: string | null;
  unreadCounts:Record<string,number>;
  totalUnreadCount:number;
  typingUsers:Record<string,TypingStatus[]>;
  onlineUsers:Record<string,boolean>;
  loading: boolean;
  error: string | null;
  searchResults: ChatUser[];
  searchLoading: boolean;
}

const initialState: ChatState = {
  chatRooms: [],
  messages: {},
  currentRoomId: null,
  unreadCounts: {},
  totalUnreadCount: 0,
  typingUsers: {},
  onlineUsers: {},
  loading: false,
  error: null,
  searchResults: [],
  searchLoading: false,
};
interface ChatConfig {
  api: any; 
  role: 'doctor' | 'patient';
  userId?: string;
  user?: any;
}
const getChatConfig = (state: RootState): ChatConfig | null => {
  if (state.doctorAuth.isAuthenticated && state.doctorAuth.doctor) {
    return {
      api: doctorAxiosInstance,
      role: 'doctor',
      userId: state.doctorAuth.doctor.id,
      user: state.doctorAuth.doctor
    };
  }
  if (state.auth.patient && state.auth.accessToken) {
    return {
      api: axiosInstance,
      role: 'patient',
      userId: state.auth.patient.id,
      user: state.auth.patient
    };
  }
  return null;
};

// Updated thunks
export const findOrCreateChatRoom = createAsyncThunk(
  "chat/findOrCreateChatRoom",
  async (params: { doctorId: string; patientId: string }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const config = getChatConfig(state);
      
      if (!config) {
        throw new Error('User not authenticated');
      }
      
      const response = await config.api.post('/chat/rooms/find-or-create', {
        doctorId: params.doctorId,
        patientId: params.patientId,
      });
      
      console.log(`✅ ${config.role} found/created chat room`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to create or find chat room");
    }
  }
);

export const searchUsers = createAsyncThunk(
  "chat/searchUsers",
  async (params: { query: string; type: "doctors" | "patients" }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const config = getChatConfig(state);
      
      if (!config) {
        throw new Error('User not authenticated');
      }
      
      console.log(`🔍 ${config.role} searching for ${params.type}: "${params.query}"`);
      
      const response = await config.api.get('/chat/search', {
        params: { q: params.query, type: params.type },
      });
      
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to search users");
    }
  }
);

// Slice

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setCurrentRoomId(state, action: PayloadAction<string | null>) {
      state.currentRoomId = action.payload;
    },
    clearSearchResults(state) {
      state.searchResults = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // 🔹 Find or create chat room
      .addCase(findOrCreateChatRoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(findOrCreateChatRoom.fulfilled, (state, action) => {
        state.loading = false;
        const exists = state.chatRooms.find((r) => r.id === action.payload.id);
        if (!exists) {
          state.chatRooms.unshift(action.payload);
        }
        state.currentRoomId = action.payload.id;
      })
      .addCase(findOrCreateChatRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to create chat room";
      })

      // 🔹 Search users
      .addCase(searchUsers.pending, (state) => {
        state.searchLoading = true;
        state.error = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.searchLoading = false;
        state.error = (action.payload as string) || "Search failed";
      });
  },
});


export const { setCurrentRoomId, clearSearchResults } = chatSlice.actions;
export default chatSlice.reducer;
