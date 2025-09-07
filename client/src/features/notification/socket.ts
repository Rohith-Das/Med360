

import { io, Socket } from 'socket.io-client';
import { store } from '@/app/store';
import { addNotification,fetchUnreadCount } from './notificationSlice';
class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(doctorId: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io('http://localhost:5001', {
      withCredentials: true,
      auth: {
        doctorId,
        userType: 'doctor'
      }
    });

    this.socket.on('connect', () => {
      console.log('Connected to socket server');
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
      store.dispatch(fetchUnreadCount());
    });

    this.socket.on('appointmentCancelled', (data) => {
      console.log('Appointment cancelled:', data);
      store.dispatch(fetchUnreadCount());
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

  joinDoctorRoom(doctorId: string) {
    if (this.socket?.connected) {
      this.socket.emit('joinDoctorRoom', doctorId);
    }
  }

  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }
}

export const socketService = new SocketService();