// src/components/chat/MessageBubble.tsx
import React from 'react';
import { format } from 'date-fns';

interface Props {
  message: {
    message: string;
    messageType?: 'text' | 'image' | 'file';
    fileUrl?: string;
    fileName?: string;
    createdAt: string;
  };
  isOwn: boolean; // true if the logged-in user sent this message
}

export const MessageBubble: React.FC<Props> = ({ message, isOwn }) => {
  const time = format(new Date(message.createdAt), 'HH:mm');

  return (
    <div
      className={`flex w-full mb-2 ${
        isOwn ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`relative max-w-[70%] px-4 py-2 rounded-2xl shadow-sm ${
          isOwn
            ? 'bg-blue-500 text-white rounded-br-none'
            : 'bg-gray-200 text-gray-800 rounded-bl-none'
        }`}
      >
        {/* Message Content */}
        {message.messageType === 'image' ? (
          <img
            src={message.fileUrl}
            alt="sent"
            className="rounded-lg max-w-full"
          />
        ) : message.messageType === 'file' ? (
          <a
            href={message.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm underline"
          >
            📎 {message.fileName}
          </a>
        ) : (
          <p className="break-words">{message.message}</p>
        )}

        {/* Timestamp */}
        <p
          className={`text-[10px] mt-1 text-right ${
            isOwn ? 'text-blue-100' : 'text-gray-500'
          }`}
        >
          {time}
        </p>

        {/* Tail for the bubble like WhatsApp */}
        <span
          className={`absolute bottom-0 ${
            isOwn
              ? 'right-[-6px] border-l-[8px] border-l-blue-500 border-t-[8px] border-t-transparent'
              : 'left-[-6px] border-r-[8px] border-r-gray-200 border-t-[8px] border-t-transparent'
          }`}
        />
      </div>
    </div>
  );
};
