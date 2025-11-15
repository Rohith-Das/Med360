// src/components/chat/ChatSidebar.tsx
import React from 'react';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { setCurrentRoomId } from '@/features/chat/chatSlice';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  onNewChat: () => void;
}

export const ChatSidebar: React.FC<Props> = ({ onNewChat }) => {
  const dispatch = useAppDispatch();
  const { chatRooms, unreadCounts, onlineUsers, currentRoomId } = useAppSelector(s => s.chat);
  const { role } = useAppSelector(s => s.doctorAuth.isAuthenticated ? { role: 'doctor' as const } : { role: 'patient' as const });

  const getOtherUser = (room: any) => {
    if (role === 'doctor') return { id: room.patientId, name: room.patient?.name, photo: room.patient?.profilePicture };
    return { id: room.doctorId, name: `Dr. ${room.doctor?.name}`, photo: room.doctor?.profilePicture, spec: room.doctor?.specialization };
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Messages</h2>
          <button onClick={onNewChat} className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chatRooms.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No conversations yet</p>
            <button onClick={onNewChat} className="text-blue-500 text-sm mt-2">Start a new chat</button>
          </div>
        ) : (
          <ul>
            {chatRooms.map(room => {
              const other = getOtherUser(room);
              const unread = unreadCounts[room.id] || 0;
              const isOnline = onlineUsers[other.id];
              const lastMsg = room.lastMessage;

              return (
                <li
                  key={room.id}
                  onClick={() => dispatch(setCurrentRoomId(room.id))}
                  className={`p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 flex gap-3 ${currentRoomId === room.id ? 'bg-blue-50' : ''}`}
                >
                  <div className="relative">
                    <img
                      src={other.photo || '/default-avatar.png'}
                      alt={other.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className="font-medium text-gray-900 truncate">{other.name}</p>
                      {lastMsg?.timestamp && (
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(lastMsg.timestamp), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    {other.spec && <p className="text-xs text-blue-600">{other.spec}</p>}
                    <p className="text-sm text-gray-600 truncate">
                      {lastMsg?.text || 'No messages yet'}
                    </p>
                  </div>
                  {unread > 0 && (
                    <div className="w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                      {unread}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};