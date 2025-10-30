import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import doctorAxiosInstance from "@/api/doctorAxiosInstance";
import axiosInstance from "@/api/axiosInstance";

// ======================
// Types
// ======================
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

// ======================
// State
// ======================
interface ChatState {
  chatRooms: ChatRoom[];
  messages: Record<string, ChatMessage[]>;
  currentRoomId: string | null;
  loading: boolean;
  error: string | null;
  searchResults: ChatUser[];
  searchLoading: boolean;
}

const initialState: ChatState = {
  chatRooms: [],
  messages: {},
  currentRoomId: null,
  loading: false,
  error: null,
  searchResults: [],
  searchLoading: false,
};

// ======================
// Async Thunks
// ======================

// 🔹 Find or create chat room
export const findOrCreateChatRoom = createAsyncThunk(
  "chat/findOrCreateChatRoom",
  async (
    params: { doctorId: string; patientId: string; role: "doctor" | "patient" },
    { rejectWithValue }
  ) => {
    try {
      const api = params.role === "doctor" ? doctorAxiosInstance : axiosInstance;
      const response = await api.post("/chat/rooms/find-or-create", {
        doctorId: params.doctorId,
        patientId: params.patientId,
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to create or find chat room");
    }
  }
);

// 🔹 Search users
export const searchUsers = createAsyncThunk(
  "chat/searchUsers",
  async (
    params: { query: string; type: "doctors" | "patients"; role: "doctor" | "patient" },
    { rejectWithValue }
  ) => {
    try {
      console.log("🔍 searchUsers role:", params.role);
      console.log("🔍 search query:", params.query);
      console.log("🔍 search type:", params.type);
      // choose axios instance based on role
      const api = params.role === "doctor" ? doctorAxiosInstance : axiosInstance;

      // dynamic endpoint for patient or doctor
      const endpoint =
        params.role === "patient"
          ? "/chat/search/patient"
          : "/chat/search/doctor";

      // make GET request
      const response = await api.get(endpoint, {
        params: { q: params.query, type: params.type },
      });

      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to search users"
      );
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
