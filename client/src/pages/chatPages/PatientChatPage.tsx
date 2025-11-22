// client/src/pages/chatPages/PatientChatPage.tsx
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
  clearError,
} from '@/features/chat/chatSlice';
import { useDebounce } from 'use-debounce';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { toast } from 'react-toastify';

const PatientChatPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { patient } = useAppSelector(s => s.patientAuth.auth);
  const {
    chatRooms,
    messages,
    currentRoomId,
    searchResults,
    searchLoading,
    error,
    typingUsers,
    onlineUsers,
    loading,
  } = useAppSelector(s => s.chat);

  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 500);
  const [isSelectingDoctor, setIsSelectingDoctor] = useState(false);

  // Socket Connection
  useEffect(() => {
    if (!patient?.id) return;

    console.log('🔌 Connecting patient to chat socket');
    chatSocketService.connect(patient.id, 'patient');

    const msgId = chatSocketService.onNewMessage(msg => {
      console.log('💬 New message received:', msg);
      dispatch(addNewMessage(msg));
    });

    const statusId = chatSocketService.onUserStatus(status => {
      console.log('👤 User status update:', status);
      dispatch(setOnlineStatus({ userId: status.userId, isOnline: status.isOnline }));
    });

    const typingId = chatSocketService.onTyping(data => {
      console.log('⌨️ Typing event:', data);
      dispatch(setTypingStatus(data));
    });

    return () => {
      console.log('🔌 Disconnecting patient from chat socket');
      chatSocketService.offNewMessage(msgId);
      chatSocketService.offUserStatus(statusId);
      chatSocketService.offTyping(typingId);
      chatSocketService.disconnect();
    };
  }, [patient?.id, dispatch]);

  // Load Rooms
  useEffect(() => {
    console.log('📂 Loading chat rooms');
    dispatch(fetchChatRooms({}));
  }, [dispatch]);

  // Search
  useEffect(() => {
    if (debouncedQuery.trim()) {
      console.log('🔍 Searching doctors:', debouncedQuery);
      dispatch(searchUsers({ query: debouncedQuery }));
    } else {
      dispatch(clearSearchResults());
    }
  }, [debouncedQuery, dispatch]);


  // Join Room
  const currentRoom = chatRooms.find(r => r.id === currentRoomId);
  
  useEffect(() => {
    if (currentRoomId) {
      console.log('🚪 Joining room:', currentRoomId);
      chatSocketService.joinRoom(currentRoomId);
      dispatch(fetchChatMessages({ roomId: currentRoomId }));
      dispatch(markMessagesAsRead(currentRoomId));
    }
    
    return () => {
      if (currentRoomId) {
        console.log('🚪 Leaving room:', currentRoomId);
        chatSocketService.leaveRoom(currentRoomId);
      }
    };
  }, [currentRoomId, dispatch]);

  // Clear errors
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const handleSelectDoctor = async (doctorId: string, doctorName: string) => {
    if (!patient?.id || isSelectingDoctor) return;

    try {
      setIsSelectingDoctor(true);
      console.log('👨‍⚕️ Selecting doctor:', doctorId, doctorName);

      const result = await dispatch(
        findOrCreateChatRoom({ 
          doctorId, 
          patientId: patient.id 
        })
      );

      if (findOrCreateChatRoom.fulfilled.match(result)) {
        console.log('✅ Chat room ready:', result.payload.id);
        dispatch(setCurrentRoomId(result.payload.id));
        setShowSearch(false);
        setQuery('');
        dispatch(clearSearchResults());
      } else if (findOrCreateChatRoom.rejected.match(result)) {
        console.error('❌ Failed to create chat room:', result.payload);
        // Error toast already shown by thunk
      }
    } catch (err) {
      console.error('❌ Unexpected error selecting doctor:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSelectingDoctor(false);
    }
  };

  const handleCloseSearch = () => {
    setShowSearch(false);
    setQuery('');
    dispatch(clearSearchResults());
    dispatch(clearError());
  };

  const roomMessages = currentRoomId ? messages[currentRoomId] || [] : [];
  const typingNames = currentRoomId 
    ? (typingUsers[currentRoomId]?.filter(t => t.isTyping).map(t => t.userName).join(', ') || '')
    : '';
  
 const otherUser = currentRoom
  ? {
      id: currentRoom.doctorId,
      name: currentRoom.doctor?.name
        ? `Dr. ${currentRoom.doctor.name}`
        : 'Doctor',
      photo: currentRoom.doctor?.profilePicture || '/default-avatar.png',
      specialization: currentRoom.doctor?.specialization,
    }
  : null;


  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <ChatSidebar onNewChat={() => setShowSearch(true)} />

      {/* Main Chat Area */}
      {currentRoomId && currentRoom ? (
        <div className="flex-1 flex flex-col">
        <ChatHeader
  name={otherUser?.name || ''}

  isOnline={!!onlineUsers[otherUser?.id || '']}
  specialization={otherUser?.specialization}
/>


       
<div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
    {loading && roomMessages.length === 0 ? (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-500">Loading messages...</p>
        </div>
      </div>
    ) : roomMessages.length === 0 ? (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium mb-2">No messages yet</p>
          <p className="text-sm">Start the conversation!</p>
        </div>
      </div>
    ) : (
      <>
        {/* FIX: Reverse the array before mapping.
          This ensures the messages are rendered chronologically (oldest at the top, newest at the bottom),
          which is necessary for standard chat scrolling behavior.
        */}
        {[...roomMessages].reverse().map(msg => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.senderId === patient?.id}
          />
        ))}
        {typingNames && <TypingIndicator names={[typingNames]} />}
      </>
    )}
</div>

          <ChatInput roomId={currentRoomId} />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center max-w-md px-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 rounded-xl w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Med360 Chat</h3>
            <p className="text-gray-500 mb-8">Connect with your doctors securely</p>
            <button
              onClick={() => setShowSearch(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition shadow-lg flex items-center gap-2 mx-auto font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search Doctors
            </button>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Find a Doctor</h2>
                <button
                  onClick={handleCloseSearch}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="p-6">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search by name or specialization..."
                  className="w-full px-4 py-3 pl-11 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Search Results */}
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
                  {query && (
                    <p className="text-sm text-gray-500 mt-2">
                      Try searching by doctor name or medical specialization
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 mb-3">
                    Found {searchResults.length} doctor{searchResults.length > 1 ? 's' : ''}
                  </p>
                  {searchResults.map(d => (
                    <button
                      key={d.id}
                      onClick={() => handleSelectDoctor(d.id, d.name)}
                      disabled={isSelectingDoctor}
                      className="w-full p-4 bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-200 hover:border-blue-300 transition flex items-center gap-4 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <img
                        src={d.profilePicture || '/default-avatar.png'}
                        alt={d.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">Dr. {d.name}</p>
                        {d.specialization && (
                          <p className="text-sm text-blue-600">{d.specialization}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">Tap to start chat</p>
                      </div>
                      {isSelectingDoctor ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
                      ) : (
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50">
              <button
                onClick={handleCloseSearch}
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