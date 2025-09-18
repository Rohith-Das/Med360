

import { io, Socket } from 'socket.io-client';
import { store } from '@/app/store';
import { addNotification,fetchUnreadCount } from './notificationSlice';
import { toast } from 'react-toastify';

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
        userType: role
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

    this.socket.on('new_notification', (notification) => {
      console.log('New notification received:', notification);
      store.dispatch(addNotification(notification));
      
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico'
        });
      }
       toast.info(notification.title, {
        position: "top-right",
        autoClose: 5000,
      });
    
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

      toast.info(`Incoming video from ${data.initiatorRole==='doctor'?'Doctor':'Patient'}`,
        {
          position:'top-right',
          autoClose:10000,
          onClick:()=>{
            window.dispatchEvent(new CustomEvent('accept_video_call',{detail:data}))
          }
        }
      )
    })
    this.socket.on('video_call_ended', (data) => {
      console.log('Video call ended via socket:', data);
      window.dispatchEvent(new CustomEvent('video_call_ended', { detail: data }));
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
     this.socket.on('call_accepted', (data) => {
      console.log('Call accepted:', data);
      toast.success('Call was accepted!', {
        position: "top-right",
        autoClose: 3000,
      });
    });
     this.socket.on('call_declined', (data) => {
      console.log('Call declined:', data);
      toast.error('Call was declined', {
        position: "top-right",
        autoClose: 3000,
      });
    });
     this.socket.on('call_participant_joined', (data) => {
      console.log('Participant joined call:', data);
      toast.success(`${data.userName} joined the call`, {
        position: "top-right",
        autoClose: 3000,
      });
    });

    this.socket.on('video:room-participants', (data) => {
      console.log('Room participants updated:', data);
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
  emitVideoCallEvent(event: string, data: any) {
    if (this.socket?.connected) {
      console.log(`Emitting ${event}:`, data);
      this.socket.emit(event, data);
    } else {
      console.warn(`Cannot emit ${event}: socket not connected`);
    }
  }
   joinVideoRoom(roomId: string, userData: any) {
    if (this.socket?.connected) {
      console.log(`Joining video room ${roomId}:`, userData);
      this.socket.emit('video:join-room', { roomId, ...userData });
    } else {
      console.warn(`Cannot join video room ${roomId}: socket not connected`);
    }
  }
   leaveVideoRoom(roomId: string) {
    if (this.socket?.connected) {
      console.log(`Leaving video room ${roomId}`);
      this.socket.emit('video:leave-room', { roomId });
    } else {
      console.warn(`Cannot leave video room ${roomId}: socket not connected`);
    }
  }

}

export const socketService = new SocketService();