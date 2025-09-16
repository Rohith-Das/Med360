import { createSlice,createAsyncThunk,PayloadAction } from "@reduxjs/toolkit";
import doctorAxiosInstance from "@/api/doctorAxiosInstance";
import axiosInstance from "@/api/axiosInstance";
import { useAppSelector } from "@/app/hooks";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
type: 'appointment_booked' | 'appointment_cancelled' | 'video_call_initiated' | 'general';  isRead: boolean;
  data?: {
    appointmentId?: string;
    patientId?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    consultingFee?: number;
    refundAmount?: number;
    cancelReason?: string;
    roomId?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

const getApiInstance=()=>{
  return doctorAxiosInstance;
}

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (params?: { limit?: number; offset?: number; unreadOnly?: boolean;role?:'doctor'|'patient' }) => {
    const api=params?.role==='patient'? axiosInstance : doctorAxiosInstance;
    const endpoint=params?.role==='patient'?'/patient/notifications':'/doctor'
    const response = await api.get(endpoint, { params:{...params,role:undefined}});
    return response.data.data
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (role?: 'doctor' | 'patient') => {
    const api = role === 'patient' ? axiosInstance : doctorAxiosInstance;
    const endpoint = role === 'patient' ? '/patient/notifications/unread' : '/doctor/unread';
    const response = await api.get(endpoint);
    return response.data.data;
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async ({ notificationId, role }: { notificationId: string; role: 'doctor' | 'patient' }) => {
    const api = role === 'patient' ? axiosInstance : doctorAxiosInstance;
    const endpoint = role === 'patient' ? `/patient/notifications/${notificationId}/read` : `/doctor/${notificationId}/read`;
    await api.put(endpoint);
    return notificationId;
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.notifications || [];
        state.unreadCount = action.payload.unreadCount || 0;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch notifications';
      })
      // Fetch unread count
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload.length || 0;
      })
      // Mark as read
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload);
        if (notification && !notification.isRead) {
          notification.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      });
  },
});

export const { addNotification, markAsRead, clearError } = notificationSlice.actions;
export default notificationSlice.reducer;