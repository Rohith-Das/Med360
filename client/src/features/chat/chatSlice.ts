import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import doctorAxiosInstance from "@/api/doctorAxiosInstance";
import axiosInstance from "@/api/axiosInstance";
import { RootState } from "@/app/store";
import { ChatMessage,UserStatus,TypingData } from "@/types/chat.types";

export interface ChatUser {
  id: string;
  name: string;
  profilePicture?: string;
  specialization?: string;          // only for doctors
}

/* ── ChatRoom ── */
export interface ChatRoom {
  id: string;
  doctorId: string;
  patientId: string;
  doctor?: ChatUser;               // populated
  patient?: ChatUser;              // populated
  lastAppointmentDate: Date;
  lastMessage?: {
    text: string;
    timestamp: Date;
    senderType: "doctor" | "patient";
  };
  createdAt: string;
  updatedAt: string;
}


interface UploadStatus {
  status: "idle" | "uploading" | "completed" | "failed";
  progress: number;
  currentFile?: string;
}

/* ── State ── */
interface ChatState {
  chatRooms: ChatRoom[];
  messages: Record<string, ChatMessage[]>;
  currentRoomId: string | null;
  unreadCounts: Record<string, number>;
  totalUnreadCount: number;
  typingUsers: Record<string, TypingData[]>;
  onlineUsers: Record<string, boolean>;
  loading: boolean;
  error: string | null;
  searchResults: ChatUser[];
  searchLoading: boolean;
  uploadStatus: UploadStatus;
}

/* ── Initial State ── */
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
  uploadStatus: { status: "idle", progress: 0 },
};

/* ── Helper to pick correct axios instance ── */
interface ChatConfig {
  api: any;
  role: "doctor" | "patient";
  userId: string;
  user?: any;
}
const getChatConfig = (state: RootState): ChatConfig => {
  if (state.doctorAuth.doctorAuth.doctor && state.doctorAuth.doctorAuth.doctorAccessToken) {
    return {
      api: doctorAxiosInstance,
      role: "doctor",
      userId: state.doctorAuth.doctorAuth.doctor.id,
      user: state.doctorAuth.doctorAuth.doctor,
    };
  }
  if (state.patientAuth.auth.patient && state.patientAuth.auth.accessToken) {
    return {
      api: axiosInstance,
      role: "patient",
      userId: state.patientAuth.auth.patient.id,
      user: state.patientAuth.auth.patient,
    };
  }
  throw new Error("User not authenticated");
};

/* ──────────────────────── Async Thunks ──────────────────────── */

export const findOrCreateChatRoom = createAsyncThunk(
  "chat/findOrCreateChatRoom",
  async (params: { doctorId: string; patientId: string }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const config = getChatConfig(state);
      const { data } = await config.api.post("/chat/rooms/find-or-create", params);
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message ?? "Failed to create/find chat room");
    }
  }
);

export const searchUsers = createAsyncThunk(
  "chat/searchUsers",
  async (params: { query: string }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const config = getChatConfig(state);
      const { data } = await config.api.get("/chat/search", { params: { q: params.query } });
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message ?? "Search failed");
    }
  }
);

export const fetchChatRooms = createAsyncThunk(
  "chat/fetchChatRooms",
  async (params: { limit?: number; offset?: number } = {}, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const config = getChatConfig(state);
      const { data } = await config.api.get("/chat/rooms", {
        params: { limit: params.limit ?? 50, offset: params.offset ?? 0 },
      });
      return data;               // { chatRooms: [...], unreadCounts: { ... } }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message ?? "Failed to fetch chat rooms");
    }
  }
);

export const fetchChatMessages = createAsyncThunk(
  "chat/fetchChatMessages",
  async (
    params: { roomId: string; limit?: number; offset?: number; loadMore?: boolean },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as RootState;
      const config = getChatConfig(state);
      const { data } = await config.api.get(`/chat/messages/${params.roomId}`, {
        params: { limit: params.limit ?? 50, offset: params.offset ?? 0 },
      });
      return {
        roomId: params.roomId,
        messages: data.data,
        loadMore: params.loadMore ?? false,
        hasMore: data.data.length === (params.limit ?? 50),
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message ?? "Failed to fetch messages");
    }
  }
);

export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async (
    params: {
      roomId: string;
      message: string;
      messageType?: "text" | "image" | "file";
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
      tempId?: string;
    },
    { rejectWithValue, getState, dispatch }
  ) => {
    try {
      const state = getState() as RootState;
      const config = getChatConfig(state);

      // optimistic UI
      const tempMessage: ChatMessage = {
        id: params.tempId ?? `temp-${Date.now()}`,
        chatRoomId: params.roomId,
        senderId: config.userId,
        senderName: config.user?.name,
        senderType: config.role,
        messageType: params.messageType ?? "text",
        message: params.message,
        fileUrl: params.fileUrl,
        fileName: params.fileName,
        fileSize: params.fileSize,
        isRead: false,
        status: "sending",
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dispatch(addTempMessage({ roomId: params.roomId, message: tempMessage }));

      const { data } = await config.api.post("/chat/messages/send", {
        chatRoomId: params.roomId,
        senderId: config.userId,
        senderType: config.role,
        message: params.message,
        messageType: params.messageType ?? "text",
        fileUrl: params.fileUrl,
        fileName: params.fileName,
        fileSize: params.fileSize,
      });

      const saved = data.data;
      dispatch(replaceTempMessage({ roomId: params.roomId, tempId: tempMessage.id, savedMessage: saved }));
      return saved;
    } catch (error: any) {
      dispatch(markMessageFailed({ roomId: params.roomId, tempId: params.tempId }));
      return rejectWithValue(error.response?.data?.message ?? "Failed to send message");
    }
  }
);

export const markMessagesAsRead = createAsyncThunk(
  "chat/markMessagesAsRead",
  async (roomId: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const config = getChatConfig(state);
      const { data } = await config.api.put("/chat/messages/read", { roomId });
      return { roomId, readCount: data.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message ?? "Failed to mark read");
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  "chat/fetchUnreadCount",
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const config = getChatConfig(state);
      const { data } = await config.api.get("/chat/unread-count");
      return data.data.count;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message ?? "Failed to fetch unread count");
    }
  }
);

/* ──────────────────────── Slice ──────────────────────── */
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
    clearError(state) {
      state.error = null;
    },

    /* ── Optimistic UI ── */
    addTempMessage(state, action: PayloadAction<{ roomId: string; message: ChatMessage }>) {
      const { roomId, message } = action.payload;
      if (!state.messages[roomId]) state.messages[roomId] = [];
      state.messages[roomId].push(message);
    },
    replaceTempMessage(
      state,
      action: PayloadAction<{ roomId: string; tempId: string; savedMessage: ChatMessage }>
    ) {
      const { roomId, tempId, savedMessage } = action.payload;
      const arr = state.messages[roomId];
      if (arr) {
        const idx = arr.findIndex((m) => m.id === tempId);
        if (idx !== -1) arr[idx] = savedMessage;
      }
    },
    markMessageFailed(state, action: PayloadAction<{ roomId: string; tempId?: string }>) {
      const { roomId, tempId } = action.payload;
      const arr = state.messages[roomId];
      if (arr && tempId) {
        const msg = arr.find((m) => m.id === tempId);
        if (msg) msg.status = "failed";
      }
    },

    /* ── Socket ── */
    addNewMessage(state, action: PayloadAction<ChatMessage>) {
      const msg = action.payload;
      const roomId = msg.chatRoomId;

      if (!state.messages[roomId]) state.messages[roomId] = [];

      if (state.messages[roomId].some((m) => m.id === msg.id)) return; // dedupe

      state.messages[roomId].push(msg);

      // update lastMessage
      const room = state.chatRooms.find((r) => r.id === roomId);
      if (room) {
        room.lastMessage = {
          text: msg.message,
          timestamp: new Date(msg.createdAt),
          senderType: msg.senderType,
        };
      }

      // unread badge
      if (roomId !== state.currentRoomId) {
        state.unreadCounts[roomId] = (state.unreadCounts[roomId] ?? 0) + 1;
        state.totalUnreadCount += 1;
      }
    },

    updateMessageStatus(
      state,
      action: PayloadAction<{ roomId: string; messageId: string; status: "sent" | "delivered" | "seen" }>
    ) {
      const { roomId, messageId, status } = action.payload;
      const msg = state.messages[roomId]?.find((m) => m.id === messageId);
      if (msg) msg.status = status;
    },

    /* ── Upload ── */
    setUploadStatus(state, action: PayloadAction<UploadStatus>) {
      state.uploadStatus = action.payload;
    },
    setUploadProgress(state, action: PayloadAction<number>) {
      state.uploadStatus.progress = action.payload;
    },
    clearUploadStatus(state) {
      state.uploadStatus = { status: "idle", progress: 0 };
    },

    /* ── Typing ── */
    setTypingStatus(state, action: PayloadAction<TypingData>) {
      const { roomId, userId, isTyping } = action.payload;
      if (!state.typingUsers[roomId]) state.typingUsers[roomId] = [];

      if (isTyping) {
        const idx = state.typingUsers[roomId].findIndex((u) => u.userId === userId);
        if (idx === -1) state.typingUsers[roomId].push(action.payload);
      } else {
        state.typingUsers[roomId] = state.typingUsers[roomId].filter((u) => u.userId !== userId);
      }
    },

    /* ── Online ── */
    setOnlineStatus(state, action: PayloadAction<{ userId: string; isOnline: boolean }>) {
      const { userId, isOnline } = action.payload;
      state.onlineUsers[userId] = isOnline;
    },
  },

  extraReducers: (builder) => {
    /* ── findOrCreateChatRoom ── */
    builder
      .addCase(findOrCreateChatRoom.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(findOrCreateChatRoom.fulfilled, (s, a) => {
        s.loading = false;
        const exists = s.chatRooms.some((r) => r.id === a.payload.id);
        if (!exists) s.chatRooms.unshift(a.payload);
        s.currentRoomId = a.payload.id;
      })
      .addCase(findOrCreateChatRoom.rejected, (s, a) => {
        s.loading = false;
        s.error = (a.payload as string) ?? "Failed to create chat room";
      });

    /* ── searchUsers ── */
    builder
      .addCase(searchUsers.pending, (s) => {
        s.searchLoading = true;
        s.error = null;
      })
      .addCase(searchUsers.fulfilled, (s, a) => {
        s.searchLoading = false;
        s.searchResults = a.payload;
      })
      .addCase(searchUsers.rejected, (s, a) => {
        s.searchLoading = false;
        s.error = (a.payload as string) ?? "Search failed";
      });

    /* ── fetchChatRooms ── */
    builder
      .addCase(fetchChatRooms.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
 .addCase(fetchChatRooms.fulfilled, (s, a) => {
  s.loading = false;
  
  console.log('📥 [SLICE] Received chat rooms:', a.payload);
  
  // ✅ Handle both response formats
  const chatRooms = a.payload.chatRooms || a.payload.data?.chatRooms || [];
  const unreadCounts = a.payload.unreadCounts || a.payload.data?.unreadCounts || {};
  
  s.chatRooms = chatRooms;
  s.unreadCounts = unreadCounts;
  s.totalUnreadCount = Object.values(unreadCounts).reduce(
    (acc: number, cur) => acc + (cur as number), 
    0
  );
      })
      .addCase(fetchChatRooms.rejected, (s, a) => {
        s.loading = false;
        s.error = (a.payload as string) ?? "Failed to fetch chat rooms";
      });

    /* ── fetchChatMessages ── */
    builder
      .addCase(fetchChatMessages.pending, (s) => {
        s.loading = true;
      })
      .addCase(fetchChatMessages.fulfilled, (s, a) => {
        s.loading = false;
        const { roomId, messages, loadMore } = a.payload;

        if (!s.messages[roomId]) s.messages[roomId] = [];

        const mapped = messages.map((m: any) => ({
          ...m,
          id: m._id ?? m.id,
          senderName: m.senderName,
        }));

        if (loadMore) {
          s.messages[roomId] = [...mapped.reverse(), ...s.messages[roomId]];
        } else {
          s.messages[roomId] = mapped.reverse();
        }
      })
      .addCase(fetchChatMessages.rejected, (s, a) => {
        s.loading = false;
        s.error = (a.payload as string) ?? "Failed to fetch messages";
      });

    /* ── sendMessage ── */
    builder.addCase(sendMessage.fulfilled, (s, a) => {
      const msg = a.payload;
      const roomId = msg.chatRoomId;

      // replace temp
      const arr = s.messages[roomId];
      if (arr) {
        const idx = arr.findIndex((m) => m.id.startsWith("temp-"));
        if (idx !== -1) arr[idx] = msg;
      }

      // lastMessage
      const room = s.chatRooms.find((r) => r.id === roomId);
      if (room) {
        room.lastMessage = {
          text: msg.message,
          timestamp: new Date(msg.createdAt),
          senderType: msg.senderType,
        };
      }
    });

    /* ── markMessagesAsRead ── */
    builder.addCase(markMessagesAsRead.fulfilled, (s, a) => {
      const { roomId } = a.payload;
      const msgs = s.messages[roomId]??[] ;
      if (msgs) {
        msgs.forEach((m) => {
          if (!m.isRead && m.senderType !== s.currentRoomId /* adjust if needed */) {
            m.isRead = true;
            m.status = "seen";
          }
        });
      }
      const old = s.unreadCounts[roomId] ?? 0;
      s.unreadCounts[roomId] = 0;
      s.totalUnreadCount = Math.max(0, s.totalUnreadCount - old);
    });

    /* ── fetchUnreadCount ── */
    builder.addCase(fetchUnreadCount.fulfilled, (s, a) => {
      s.totalUnreadCount = a.payload;
    });
  },
});

/* ── Export actions ── */
export const {
  setCurrentRoomId,
  clearSearchResults,
  clearError,
  addTempMessage,
  replaceTempMessage,
  markMessageFailed,
  addNewMessage,
  updateMessageStatus,
  setUploadStatus,
  setUploadProgress,
  clearUploadStatus,
  setTypingStatus,
  setOnlineStatus,
} = chatSlice.actions;

export default chatSlice.reducer;