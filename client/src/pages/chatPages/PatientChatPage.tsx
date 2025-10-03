import { useEffect, useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { chatSocketService } from '@/services/chatSocketServer';
import {
  fetchChatRooms,
  fetchChatMessages,
  setCurrentChatRoom,
  clearCurrentChat,
  markMessagesAsRead,
  uploadChatFile
} from '@/features/chat/chatSlice';
import { Send, Paperclip, ArrowLeft, MoreVertical, Phone, Video, Circle } from 'lucide-react';
import { toast } from 'react-toastify';

const formatTime = (date: string) => {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (date: string) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getInitials = (name?: string) => {
  if (!name) return 'Dr';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export default function PatientChatPage() {
  const dispatch = useAppDispatch();
  const { patient } = useAppSelector((state) => state.auth);
  const {
    chatRooms,
    currentChatMessages,
    currentChatRoomId,
    loading,
    sendingMessage,
    typingUsers,
    onlineUsers
  } = useAppSelector((state) => state.chat);

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (patient?.id) {
      chatSocketService.connect(patient.id, 'patient');
      dispatch(fetchChatRooms('patient'));
    }

    return () => {
      if (currentChatRoomId) {
        chatSocketService.leaveChatRoom(currentChatRoomId);
      }
    };
  }, [patient?.id, dispatch]);

  useEffect(() => {
    scrollToBottom();
  }, [currentChatMessages]);

  useEffect(() => {
    const handleNavigateToChat = (event: any) => {
      const { participantId } = event.detail;
      handleSelectRoom(participantId);
    };

    window.addEventListener('navigate_to_chat', handleNavigateToChat);
    return () => window.removeEventListener('navigate_to_chat', handleNavigateToChat);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectRoom = async (doctorId: string) => {
    if (!patient?.id) return;

    const chatRoomId = `${doctorId}_${patient.id}`;
    
    if (currentChatRoomId) {
      chatSocketService.leaveChatRoom(currentChatRoomId);
    }

    setSelectedRoomId(doctorId);
    dispatch(setCurrentChatRoom(chatRoomId));
    chatSocketService.joinChatRoom(chatRoomId);

    try {
      await dispatch(fetchChatMessages({
        participantId: doctorId,
        role: 'patient',
        page: 1,
        limit: 50
      })).unwrap();

      dispatch(markMessagesAsRead({ 
        participantId: chatRoomId, 
        role: 'patient',
        userId: patient.id 
      }));
      chatSocketService.markMessagesAsRead(chatRoomId);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedRoomId || !patient?.id) return;

    const chatRoomId = `${selectedRoomId}_${patient.id}`;

    try {
      chatSocketService.sendMessage(chatRoomId, messageInput.trim(), 'text');
      setMessageInput('');
      handleStopTyping();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    }
  };

  const handleTyping = () => {
    if (!selectedRoomId || !patient?.id) return;

    const chatRoomId = `${selectedRoomId}_${patient.id}`;

    if (!isTyping) {
      setIsTyping(true);
      chatSocketService.startTyping(chatRoomId);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 3000);
  };

  const handleStopTyping = () => {
    if (!selectedRoomId || !patient?.id || !isTyping) return;

    const chatRoomId = `${selectedRoomId}_${patient.id}`;
    setIsTyping(false);
    chatSocketService.stopTyping(chatRoomId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedRoomId) return;

    try {
      await dispatch(uploadChatFile({
        participantId: selectedRoomId,
        file,
        role: 'patient'
      })).unwrap();

      toast.success('File uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload file');
    }
  };

  // FIXED: Find room by doctorId instead of chatRoomId
  const selectedRoom = chatRooms.find(room => room.doctorId === selectedRoomId);

  const isDoctorOnline = selectedRoomId ? onlineUsers.includes(selectedRoomId) : false;
  const isDoctorTyping = selectedRoomId ? typingUsers.includes(selectedRoomId) : false;

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Messages</h2>
          <p className="text-sm text-gray-500 mt-1">Chat with your doctors</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && !chatRooms.length ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : chatRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
              <p className="text-center">No conversations yet</p>
              <p className="text-sm text-center mt-2">Book an appointment to start chatting</p>
            </div>
          ) : (
            chatRooms.map((room) => {
              const doctorId = room.doctorId;
              const unreadCount = room.unreadCountPatient;
              const isSelected = selectedRoomId === doctorId;
              const doctorName = room.doctorName || 'Doctor';
  console.log('Chat Room:', {
    roomId: room.id,
    doctorId,
    doctorName,
    unreadCount,
    lastMessage: room.lastMessage
  });
              return (
                <div
                  key={room.id}
                  onClick={() => handleSelectRoom(doctorId)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                          {getInitials(doctorName)}
                        </div>
                        {onlineUsers.includes(doctorId) && (
                          <Circle className="w-3 h-3 text-green-500 fill-green-500 absolute bottom-0 right-0" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          Dr. {doctorName}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {room.lastMessage || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end ml-2">
                      {room.lastMessageAt && (
                        <span className="text-xs text-gray-400">
                          {formatDate(room.lastMessageAt)}
                        </span>
                      )}
                      {unreadCount > 0 && (
                        <span className="mt-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedRoomId && selectedRoom ? (
          <>
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    setSelectedRoomId(null);
                    dispatch(clearCurrentChat());
                  }}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-full"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                  {getInitials(selectedRoom.doctorName)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Dr. {selectedRoom.doctorName || 'Doctor'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {isDoctorTyping ? (
                      <span className="text-blue-600">typing...</span>
                    ) : isDoctorOnline ? (
                      <span className="text-green-600">Online</span>
                    ) : (
                      'Offline'
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <Phone className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <Video className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {currentChatMessages.map((message) => {
                const isSent = message.senderId === patient?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-2xl ${
                        isSent
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-white text-gray-900 rounded-bl-none shadow-sm'
                      }`}
                    >
                      {message.messageType === 'image' && message.fileUrl && (
                        <img
                          src={message.fileUrl}
                          alt="Shared"
                          className="rounded-lg mb-2 max-w-full"
                        />
                      )}
                      {message.messageType === 'file' && message.fileUrl && (
                        <a
                          href={message.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 underline"
                        >
                          <Paperclip className="w-4 h-4" />
                          <span>{message.fileName}</span>
                        </a>
                      )}
                      <p className="break-words">{message.message}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isSent ? 'text-blue-100' : 'text-gray-400'
                        }`}
                      >
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-center space-x-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  disabled={sendingMessage}
                >
                  <Paperclip className="w-5 h-5 text-gray-600" />
                </button>
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  disabled={sendingMessage}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sendingMessage}
                  className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <p className="text-lg">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}