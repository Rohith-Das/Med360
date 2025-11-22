// src/components/chat/ChatHeader.tsx
import React from 'react';

interface Props {
  name: string;
  photo?: string;
  isOnline: boolean;
  specialization?: string;
}

export const ChatHeader: React.FC<Props> = ({ name, photo, isOnline, specialization }) => {
  return (
    <div className="p-4 border-b border-gray-200 bg-white flex items-center gap-3">
      <div className="relative">
        <img
          src={photo || '/default-avatar.png'}
          alt={name}
          className="w-10 h-10 rounded-full object-cover bg-gray-200"
        />
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
        )}
      </div>

      <div>
        <p className="font-semibold">{name}</p>

        {specialization && (
          <p className="text-xs text-blue-600">{specialization}</p>
        )}

        <p className="text-xs text-gray-500">
          {isOnline ? 'Online' : 'Offline'}
        </p>
      </div>
    </div>
  );
};
