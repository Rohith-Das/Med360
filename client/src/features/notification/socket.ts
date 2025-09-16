

import { io, Socket } from 'socket.io-client';
import { store } from '@/app/store';
import { addNotification,fetchUnreadCount } from './notificationSlice';
class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(userId:string,role:'doctor'|'patient') {
    if (this.socket?.connected) {
      return;
    }
    const apiUrl='http://localhost:5001';
    this.socket = io(apiUrl, {
      withCredentials: true,
      auth: {
        token:role==='doctor'? store.getState().doctorAuth.doctorAccessToken : store.getState().auth.accessToken,
        userId,
        userType: 'role'
      }
    });

    this.socket.on('connect', () => {
      console.log(`Connected to socket server as ${role}`);
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      this.isConnected = false;
    });

    this.socket.on('notification', (notification) => {
      console.log('New notification received:', notification);
      store.dispatch(addNotification(notification));
      
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico'
        });
      }
    });

    this.socket.on('appointmentBooked', (data) => {
      console.log('Appointment booked:', data);
      store.dispatch(fetchUnreadCount(role));
    });

    this.socket.on('appointmentCancelled', (data) => {
      console.log('Appointment cancelled:', data);
      store.dispatch(fetchUnreadCount(role));
    });
    
    this.socket.on('incoming_video_call',(data)=>{
      console.log('Incoming video call via socket:', data);
      window.dispatchEvent(new CustomEvent('incoming_video_call',{detail:data}))
    })
    this.socket.on('video_call_ended', (data) => {
      console.log('Video call ended via socket:', data);
      window.dispatchEvent(new CustomEvent('video_call_ended', { detail: data }));
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }



  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }
}

export const socketService = new SocketService();