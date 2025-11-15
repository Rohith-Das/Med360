import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { chatSocketService } from '@/services/chatSocketServer';
import {
  searchUsers,
  findOrCreateChatRoom,
  clearSearchResults,
  setCurrentRoomId,
  fetchChatRooms,
  fetchChatMessages,
  markMessagesAsRead,
  addNewMessage,
  setOnlineStatus,
  setTypingStatus,
} from '@/features/chat/chatSlice';
import { useDebounce } from 'use-debounce';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';

const PatientChatPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { patient } = useAppSelector(s => s.auth);
  const {
    chatRooms,
    messages,
    currentRoomId,
    searchResults,
    searchLoading,
    error,
    typingUsers,
    onlineUsers,
  } = useAppSelector(s => s.chat);

  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 500);

  // Socket
  useEffect(() => {
    if (!patient?.id) return;

    chatSocketService.connect(patient.id, 'patient');

    const msgId = chatSocketService.onNewMessage(msg => dispatch(addNewMessage(msg)));
    const statusId = chatSocketService.onUserStatus(status =>
      dispatch(setOnlineStatus({ userId: status.userId, isOnline: status.isOnline }))
    );
    const typingId = chatSocketService.onTyping(data => dispatch(setTypingStatus(data)));

    return () => {
      chatSocketService.offNewMessage(msgId);
      chatSocketService.offUserStatus(statusId);
      chatSocketService.offTyping(typingId);
      chatSocketService.disconnect();
    };
  }, [patient?.id, dispatch]);

  // Load Rooms
  useEffect(() => {
    dispatch(fetchChatRooms({}));
  }, [dispatch]);

  // Search
  useEffect(() => {
    if (debouncedQuery.trim()) {
      dispatch(searchUsers({ query: debouncedQuery }));
    } else {
      dispatch(clearSearchResults());
    }
  }, [debouncedQuery, dispatch]);

  // Join Room
  const currentRoom = chatRooms.find(r => r.id === currentRoomId);
  useEffect(() => {
    if (currentRoomId) {
      chatSocketService.joinRoom(currentRoomId);
      dispatch(fetchChatMessages({ roomId: currentRoomId }));
      dispatch(markMessagesAsRead(currentRoomId));
    }
    return () => {
      currentRoomId && chatSocketService.leaveRoom(currentRoomId);
    };
  }, [currentRoomId, dispatch]);

  const handleSelectDoctor = async (doctorId: string) => {
    const result = await dispatch(findOrCreateChatRoom({ doctorId, patientId: patient!.id }));
    if (findOrCreateChatRoom.fulfilled.match(result)) {
      dispatch(setCurrentRoomId(result.payload.id));
      setShowSearch(false);
      setQuery('');
    }
  };

  const roomMessages = currentRoomId ? messages[currentRoomId] || [] : [];
const typingNames = currentRoomId 
  ? (typingUsers[currentRoomId]?.filter(t => t.isTyping).map(t => t.userName).join(', ') || '')
  : '';
  const otherUser = currentRoom ? {
    id: currentRoom.doctorId,
    name: `Dr. ${currentRoom.doctor?.name || 'Doctor'}`,
    
    photo: currentRoom.doctor?.profilePicture,
    specialization: currentRoom.doctor?.specialization,
  } : null;

  return (
    <div className="flex h-screen bg-gray-50">
      <ChatSidebar onNewChat={() => setShowSearch(true)} />

      {currentRoomId && currentRoom ? (
        <div className="flex-1 flex flex-col">
          <ChatHeader
            name={otherUser?.name || ''}
            photo={otherUser?.photo}
            isOnline={!!onlineUsers[otherUser?.id || '']}
            specialization={otherUser?.specialization}
          />

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
            {roomMessages.map(msg => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === patient?.id}
              />
            ))}
            {typingNames && <TypingIndicator names={[typingNames]} />}
          </div>

          <ChatInput roomId={currentRoomId} />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center max-w-md">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-24 h-24 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Med360 Chat</h3>
            <p className="text-gray-500 mb-8">Select a doctor or start a new chat</p>
            <button
              onClick={() => setShowSearch(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition shadow-lg flex items-center gap-2 mx-auto"
            >
              Search Doctors
            </button>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Find a Doctor</h2>
                <button
                  onClick={() => { setShowSearch(false); setQuery(''); dispatch(clearSearchResults()); }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-6">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by name or specialization..."
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div className="px-6 pb-6 max-h-96 overflow-y-auto">
              {searchLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mx-auto" />
                  <p className="mt-4 text-gray-500">Searching doctors...</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h-4m-6 0H5a2 2 0 002-2v-1" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">
                    {query ? 'No doctors found' : 'Start typing to search'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 mb-3">
                    Found {searchResults.length} doctor{searchResults.length > 1 ? 's' : ''}
                  </p>
                  {searchResults.map(d => (
                    <button
                      key={d.id}
                      onClick={() => handleSelectDoctor(d.id)}
                      className="w-full p-4 bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-200 hover:border-blue-300 transition flex items-center gap-4 text-left group"
                    >
                      <img
                        src={d.profilePicture || '/default-avatar.png'}
                        alt={d.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">Dr. {d.name}</p>
                        {d.specialization && <p className="text-sm text-blue-600">{d.specialization}</p>}
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50">
              <button
                onClick={() => { setShowSearch(false); setQuery(''); dispatch(clearSearchResults()); }}
                className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientChatPage;