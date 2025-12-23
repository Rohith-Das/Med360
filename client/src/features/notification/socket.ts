// client/src/features/notification/socket.ts
import { io, Socket } from 'socket.io-client';
import { store } from '@/app/store';
import { addNotification, fetchUnreadCount, updateNotificationData } from './notificationSlice';
import { toast } from 'react-toastify';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(userId: string, role: 'doctor' | 'patient') {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    const apiUrl = 'http://localhost:5001';
    const token = role === 'doctor' 
      ? store.getState().doctorAuth.doctorAuth.doctorAccessToken 
      : store.getState().patientAuth.auth.accessToken;

    if (!token) {
      console.error('No authentication token available');
      return;
    }

    console.log(`🔌 Connecting socket for ${role}: ${userId}`);

    this.socket = io(apiUrl, {
      withCredentials: true,
      auth: {
        token,
        userId,
        userType: role
      },
      reconnection: true,

    });

    this.setupEventHandlers(role, userId);
  }

  private setupEventHandlers(role: 'doctor' | 'patient', userId: string) {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log(`✅ Socket connected for ${role}: ${userId}`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`❌ Socket disconnected: ${reason}`);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);

      if (error.message === 'Invalid authentication token' || error.message === 'Authentication token required') {
        console.warn('Authentication failed - Disconnecting socket to prevent loop');
        this.socket?.disconnect();
        this.socket = null;
        toast.error('Session expired. Please login again.');
        return; // Stop further reconnect attempts
      }

      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        toast.error('Unable to connect to notification service');
      }
    });

    // Standard notification
    this.socket.on('new_notification', (notification) => {
      console.log('📬 New notification received:', notification);
      store.dispatch(addNotification(notification));
      
      // Browser notification
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.id
        });
      }
      
      toast.info(notification.title, {
        position: "top-right",
        autoClose: 5000,
      });
    });

    this.socket.on('incoming_video_call', (data) => {
      console.log('📞 INCOMING VIDEO CALL via socket:', data);
      console.log('📦 Call data structure:', JSON.stringify(data, null, 2));

      // Validate required fields
      if (!data.roomId || !data.appointmentId) {
        console.error('❌ Invalid call data - missing roomId or appointmentId:', data);
        toast.error('Invalid video call data received');
        return;
      }

      // Store complete call data in Redux for later use
      if (data.appointmentId) {
        store.dispatch(updateNotificationData({
          id: data.appointmentId,
          data: {
            roomId: data.roomId,
            appointmentId: data.appointmentId,
            initiatorName: data.initiatorName,
            initiatorRole: data.initiatorRole,
            appointmentTime: data.appointmentTime,
            appointmentDate: data.appointmentDate,
            callType: data.callType,
            status: 'waiting'
          }
        }));
        console.log(`✅ Call data stored in Redux for appointment: ${data.appointmentId}`);
      }

      // Dispatch custom event for component handling
      window.dispatchEvent(new CustomEvent('incoming_video_call', { detail: data }));
      console.log('✅ Custom event dispatched: incoming_video_call');

      // Show toast with action
      const callerName = data.initiatorRole === 'doctor' 
        ? `Dr. ${data.initiatorName || 'Doctor'}` 
        : data.initiatorName || 'Patient';

      toast.info(`📞 Incoming call from ${callerName}`, {
        position: "top-right",
        autoClose: 15000,
        closeButton: true,
        onClick: () => {
          console.log('🎯 Toast clicked - triggering accept');
          window.dispatchEvent(new CustomEvent('accept_video_call', { detail: data }));
        }
      });
    });

    // Call status events
    this.socket.on('call_accepted', (data) => {
      console.log('✅ Call accepted:', data);
      toast.success('Call was accepted!', {
        position: "top-right",
        autoClose: 3000,
      });
    });

    this.socket.on('call_declined', (data) => {
      console.log('❌ Call declined:', data);
      toast.error('Call was declined', {
        position: "top-right",
        autoClose: 3000,
      });
      window.dispatchEvent(new CustomEvent('video_call_ended', { detail: data }));
    });

    this.socket.on('call_participant_joined', (data) => {
      console.log('👤 Participant joined call:', data);
      toast.success(`${data.userName} joined the call`, {
        position: "top-right",
        autoClose: 3000,
      });
    });

    this.socket.on('video_call_ended', (data) => {
      console.log('📞 Video call ended via socket:', data);
      window.dispatchEvent(new CustomEvent('video_call_ended', { detail: data }));
      toast.info('Video call has ended', {
        position: "top-right",
        autoClose: 3000,
      });
    });

    // Video room events
    this.socket.on('video:room-participants', (data) => {
      console.log('👥 Room participants updated:', data);
    });

    // Appointment events
    this.socket.on('appointmentBooked', (data) => {
      console.log('📅 Appointment booked:', data);
      store.dispatch(fetchUnreadCount(role));
    });

    this.socket.on('appointmentCancelled', (data) => {
      console.log('🚫 Appointment cancelled:', data);
      store.dispatch(fetchUnreadCount(role));
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });
    // Add these event handlers in the setupEventHandlers method:

// Video room events
this.socket.on('video:participant-joined', (data) => {
  console.log('👤 Participant joined:', data);
  toast.info(`${data.userName} joined the call`, {
    position: "top-right",
    autoClose: 3000,
  });
});

this.socket.on('video:participant-left', (data) => {
  console.log('👤 Participant left:', data);
  toast.info(`${data.userName} left the call`, {
    position: "top-right",
    autoClose: 3000,
  });
});

this.socket.on('video:offer', (data) => {
  console.log('📨 Received WebRTC offer:', data);
  // Handle WebRTC offer if using peer-to-peer
});

this.socket.on('video:answer', (data) => {
  console.log('📨 Received WebRTC answer:', data);
  // Handle WebRTC answer if using peer-to-peer
});

this.socket.on('video:ice-candidate', (data) => {
  console.log('❄️ Received ICE candidate:', data);
  // Handle ICE candidate if using peer-to-peer
});
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
    }
  }

  isSocketConnected(): boolean {
    return this.isConnected && !!this.socket?.connected;
  }

  emitVideoCallEvent(event: string, data: any) {
    if (this.socket?.connected) {
      console.log(`📤 Emitting ${event}:`, data);
      this.socket.emit(event, data);
    } else {
      console.warn(`⚠️ Cannot emit ${event}: socket not connected`);
      toast.error('Connection lost. Please refresh the page.');
    }
  }

  joinVideoRoom(roomId: string, userData: any) {
    if (this.socket?.connected) {
      console.log(`🎥 Joining video room ${roomId}:`, userData);
      this.socket.emit('video:join-room', { roomId, ...userData });
    } else {
      console.warn(`⚠️ Cannot join video room ${roomId}: socket not connected`);
      toast.error('Connection lost. Please refresh the page.');
    }
  }

  leaveVideoRoom(roomId: string) {
    if (this.socket?.connected) {
      console.log(`🚪 Leaving video room ${roomId}`);
      this.socket.emit('video:leave-room', { roomId });
    } else {
      console.warn(`⚠️ Cannot leave video room ${roomId}: socket not connected`);
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();