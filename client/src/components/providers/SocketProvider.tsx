import React, { createContext, useContext, useEffect } from 'react';
import { socketService } from '@/features/notification/socket';
import { useAppSelector } from '@/app/hooks';


interface SocketContextType {
  isConnected: boolean;
  connect: (userId: string, role: 'doctor' | 'patient') => void;
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
  const { doctorAccessToken, doctor } = useAppSelector((state) => state.doctorAuth.doctorAuth);
  const { accessToken, patient } = useAppSelector((state) => state.patientAuth.auth);

  const [isConnected, setIsConnected] = React.useState(false);

  const connect = (userId: string, role: 'doctor' | 'patient') => {
    socketService.connect(userId, role);
   
    setIsConnected(true);
  };

  const disconnect = () => {
    socketService.disconnect();

    setIsConnected(false);
  };

  useEffect(() => {
    let userId: string | null = null;
    let role: 'doctor' | 'patient' | null = null;

    if (doctorAccessToken && doctor?.id) {
      userId = doctor.id;
      role = 'doctor';
    } else if (accessToken && patient?.id) {
      userId = patient.id;
      role = 'patient';
    }

    if (userId && role) {
      connect(userId, role);

      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [doctorAccessToken, doctor?.id, accessToken, patient?.id]);

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