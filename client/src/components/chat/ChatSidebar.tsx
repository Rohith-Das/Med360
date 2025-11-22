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
  
  // Determine user role

  const { isAuthenticated: isDoctorAuth } = useAppSelector(s => s.doctorAuth.doctorAuth);
  const role = isDoctorAuth ? 'doctor' : 'patient';

  console.log('🎨 [SIDEBAR] Rendering with:', {
    roomCount: chatRooms.length,
    role,
    firstRoom: chatRooms[0]
  });

  const getOtherUser = (room: any) => {
    console.log('👤 [SIDEBAR] Getting other user for room:', room.id, {
      role,
      doctor: room.doctor,
      patient: room.patient
    });

    if (role === 'doctor') {
      return {
        id: room.patientId,
        name: room.patient?.name || 'Unknown Patient',
        photo: room.patient?.profilePicture || '/default-avatar.png',
        spec: undefined
      };
    }
    
    return {
      id: room.doctorId,
      name: room.doctor?.name ? `Dr. ${room.doctor.name}` : 'Unknown Doctor',
      photo: room.doctor?.profilePicture || '/default-avatar.png',
      spec: room.doctor?.specialization
    };
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Messages</h2>
        <button
          onClick={onNewChat}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
        >
          + New
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chatRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="text-gray-400 text-5xl mb-4">💬</div>
            <p className="text-gray-600 font-medium mb-2">No conversations yet</p>
            <p className="text-gray-500 text-sm mb-4">Start a new chat</p>
            <button
              onClick={onNewChat}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
            >
              Find {role === 'doctor' ? 'Patients' : 'Doctors'}
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {chatRooms.map(room => {
              const other = getOtherUser(room);
              const unread = unreadCounts[room.id!] || 0;
              const isOnline = onlineUsers[other.id];
              const lastMsg = room.lastMessage;

              console.log('🎨 [SIDEBAR] Rendering room item:', {
                roomId: room.id,
                otherUser: other
              });

              return (
                <li key={room.id}>
                  <button
                    onClick={() => dispatch(setCurrentRoomId(room.id!))}
                    className={`w-full p-4 hover:bg-gray-50 cursor-pointer flex gap-3 text-left transition ${
                      currentRoomId === room.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={other.photo}
                        alt={other.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                        onError={(e) => {
                          e.currentTarget.src = '/default-avatar.png';
                        }}
                      />
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {other.name}
                        </h3>
                        {lastMsg?.timestamp && (
                          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                            {formatDistanceToNow(new Date(lastMsg.timestamp), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      
                      {other.spec && (
                        <p className="text-xs text-blue-600 mb-1">{other.spec}</p>
                      )}
                      
                      <p className="text-sm text-gray-600 truncate">
                        {lastMsg?.text || 'No messages yet'}
                      </p>
                    </div>

                    {/* Unread Badge */}
                    {unread > 0 && (
                      <div className="flex-shrink-0 flex items-center">
                        <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                          {unread}
                        </span>
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};