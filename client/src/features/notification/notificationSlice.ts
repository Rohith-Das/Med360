// client/src/features/notification/notificationSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import doctorAxiosInstance from "@/api/doctorAxiosInstance";
import axiosInstance from "@/api/axiosInstance";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'appointment_booked' | 'appointment_cancelled' | 'video_call_initiated' | 'video_call_ended' | 'general';
  isRead: boolean;
  data?: {
    appointmentId?: string;
    patientId?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    consultingFee?: number;
    refundAmount?: number;
    cancelReason?: string;
    roomId?: string;
    initiatorRole?: 'doctor' | 'patient';
    initiatorName?: string;
    initiatorId?: string;
    callType?: 'video';
    status?: 'waiting' | 'active' | 'ended';
    duration?: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Enhanced interface for video call data storage
interface VideoCallData {
  roomId: string;
  appointmentId: string;
  initiatorName?: string;
  initiatorRole?: 'doctor' | 'patient';
  appointmentTime?: string;
  appointmentDate?: string;
  callType?: 'video';
  status?: 'waiting' | 'active' | 'ended';
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  // CHANGED: Use plain object instead of Map for Redux serialization
  incomingCallsData: Record<string, VideoCallData>;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  incomingCallsData: {}, // Plain object instead of Map
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (params?: { limit?: number; offset?: number; unreadOnly?: boolean; role?: 'doctor' | 'patient' }) => {
    const api = params?.role === 'patient' ? axiosInstance : doctorAxiosInstance;
    const endpoint = params?.role === 'patient' ? '/patient/notifications' : '/doctor/notifications';
    const response = await api.get(endpoint, { params: { ...params, role: undefined } });
    return response.data.data;
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (role?: 'doctor' | 'patient') => {
    const api = role === 'patient' ? axiosInstance : doctorAxiosInstance;
    const endpoint = role === 'patient' ? '/patient/notifications/unread' : '/doctor/notifications/unread';
    const response = await api.get(endpoint);
    return response.data.data;
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async ({ notificationId, role }: { notificationId: string; role: 'doctor' | 'patient' }) => {
    const api = role === 'patient' ? axiosInstance : doctorAxiosInstance;
    const endpoint = role === 'patient' ? `/patient/notifications/${notificationId}/read` : `/doctor/notifications/${notificationId}/read`;
    await api.put(endpoint);
    return notificationId;
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      // Check if notification already exists
      const exists = state.notifications.find(n => n.id === action.payload.id);
      if (!exists) {
        state.notifications.unshift(action.payload);
        if (!action.payload.isRead) {
          state.unreadCount += 1;
        }

        // If it's a video call notification, store the call data
        if (action.payload.type === 'video_call_initiated' && action.payload.data) {
          const callData: VideoCallData = {
            roomId: action.payload.data.roomId || '',
            appointmentId: action.payload.data.appointmentId || '',
            initiatorName: action.payload.data.initiatorName,
            initiatorRole: action.payload.data.initiatorRole,
            appointmentTime: action.payload.data.appointmentTime,
            appointmentDate: action.payload.data.appointmentDate,
            callType: action.payload.data.callType,
            status: action.payload.data.status
          };
          
          if (callData.appointmentId) {
            // Use plain object assignment
            state.incomingCallsData[callData.appointmentId] = callData;
            console.log(`✅ Video call data stored for appointment: ${callData.appointmentId}`);
          }
        }
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
    
    // CRITICAL: Updated to use plain object instead of Map
    updateNotificationData: (state, action: PayloadAction<{ id: string; data: any }>) => {
      const { id, data } = action.payload;
      
      // Update existing notification if found
      const notification = state.notifications.find(n => 
        n.data?.appointmentId === id || n.id === id
      );
      
      if (notification && notification.data) {
        notification.data = { ...notification.data, ...data };
        console.log(`✅ Updated notification data for ${id}`);
      }

      // Store in video call data object for quick access
      if (data.roomId && data.appointmentId) {
        const callData: VideoCallData = {
          roomId: data.roomId,
          appointmentId: data.appointmentId,
          initiatorName: data.initiatorName,
          initiatorRole: data.initiatorRole,
          appointmentTime: data.appointmentTime,
          appointmentDate: data.appointmentDate,
          callType: data.callType || 'video',
          status: data.status || 'waiting'
        };
        
        // Plain object assignment
        state.incomingCallsData[data.appointmentId] = callData;
        console.log(`✅ Video call data updated for appointment: ${data.appointmentId}`);
      }
    },

    // Updated to use plain object
    removeVideoCallData: (state, action: PayloadAction<string>) => {
      const appointmentId = action.payload;
      delete state.incomingCallsData[appointmentId];
      console.log(`🧹 Removed video call data for appointment: ${appointmentId}`);
    },

    // Clear all incoming call data
    clearIncomingCalls: (state) => {
      state.incomingCallsData = {};
      console.log('🧹 Cleared all incoming call data');
    }
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

        // Extract and store video call data from fetched notifications
        action.payload.notifications?.forEach((notification: Notification) => {
          if (notification.type === 'video_call_initiated' && 
              notification.data?.roomId && 
              notification.data?.appointmentId) {
            const callData: VideoCallData = {
              roomId: notification.data.roomId,
              appointmentId: notification.data.appointmentId,
              initiatorName: notification.data.initiatorName,
              initiatorRole: notification.data.initiatorRole,
              appointmentTime: notification.data.appointmentTime,
              appointmentDate: notification.data.appointmentDate,
              callType: notification.data.callType,
              status: notification.data.status
            };
            state.incomingCallsData[callData.appointmentId] = callData;
          }
        });
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

export const { 
  addNotification, 
  markAsRead, 
  clearError, 
  updateNotificationData,
  removeVideoCallData,
  clearIncomingCalls
} = notificationSlice.actions;

export default notificationSlice.reducer;

// UPDATED Selectors to work with plain object
export const selectIncomingCallData = (state: { notifications: NotificationState }, appointmentId: string): VideoCallData | undefined => {
  return state.notifications.incomingCallsData[appointmentId];
};

export const selectAllIncomingCalls = (state: { notifications: NotificationState }): VideoCallData[] => {
  return Object.values(state.notifications.incomingCallsData);
};

export const selectHasIncomingCall = (state: { notifications: NotificationState }, appointmentId: string): boolean => {
  return appointmentId in state.notifications.incomingCallsData;
};

export const selectIncomingCallsCount = (state: { notifications: NotificationState }): number => {
  return Object.keys(state.notifications.incomingCallsData).length;
};