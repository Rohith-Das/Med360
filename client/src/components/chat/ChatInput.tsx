// src/components/chat/ChatInput.tsx
import React, { useState } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { sendMessage } from '@/features/chat/chatSlice';


interface Props {
  roomId: string;
}

export const ChatInput: React.FC<Props> = ({ roomId }) => {
  const dispatch = useAppDispatch();
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    dispatch(sendMessage({
      roomId,
      message: input,
      tempId: `temp-${Date.now()}`
    }));
    setInput('');
  };

  return (
    <div className="p-4 bg-white border-t border-gray-200 flex gap-2">
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSend()}
        placeholder="Type a message..."
        className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={handleSend}
        className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </div>
  );
};