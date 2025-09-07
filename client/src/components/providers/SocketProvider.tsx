
import React, { createContext, useContext, useEffect } from 'react';
import { socketService } from '@/features/notification/socket';
import { useAppSelector } from '@/app/hooks';


interface SocketContextType {
  isConnected: boolean;
  connect: (doctorId: string) => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { doctorAccessToken, doctor } = useAppSelector((state) => state.doctorAuth);
  const [isConnected, setIsConnected] = React.useState(false);

  const connect = (doctorId: string) => {
    socketService.connect(doctorId);
    socketService.joinDoctorRoom(doctorId);
    setIsConnected(true);
  };

  const disconnect = () => {
    socketService.disconnect();
    setIsConnected(false);
  };

  useEffect(() => {
    // Auto-connect if doctor is authenticated
    if (doctorAccessToken && doctor?.id) {
      connect(doctor.id);
      
      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    } else {
      disconnect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [doctorAccessToken, doctor?.id]);

  const value = {
    isConnected,
    connect,
    disconnect,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};