// src/components/chat/MessageBubble.tsx
import React from 'react';
import { format } from 'date-fns';
import { Check, CheckCheck, Download, FileText, Image as ImageIcon } from 'lucide-react';

interface Props {
  message: {
    id: string;
    message?: string;
    messageType?: 'text' | 'image' | 'file';
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    createdAt: string;
    status?: 'sending' | 'sent' | 'delivered' | 'seen' | 'failed';
    isRead?: boolean;
  };
  isOwn: boolean;
  showDate?: boolean; // for date separator
  isLastInGroup?: boolean; // to show/hide tail & ticks properly
}

export const MessageBubble: React.FC<Props> = ({
  message,
  isOwn,
  showDate = false,
  isLastInGroup = true,
}) => {
  const time = format(new Date(message.createdAt), 'HH:mm');

  // Status icon
  const StatusIcon = () => {
    if (!isOwn) return null;

    if (message.status === 'sending') {
      return <Check className="w-4 h-4 text-gray-300" />;
    }
    if (message.status === 'sent' || message.status === 'delivered') {
      return <CheckCheck className="w-4 h-4 text-gray-300" />;
    }
    if (message.status === 'seen') {
      return <CheckCheck className="w-4 h-4 text-blue-300" />;
    }
    return <CheckCheck className="w-4 h-4 text-gray-300" />;
  };

  // File size formatter
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      {/* Date Separator */}
      {showDate && (
        <div className="flex justify-center my-4">
          <span className="px-3 py-1 text-xs text-gray-500 bg-gray-100 rounded-full">
            {format(new Date(message.createdAt), 'dd MMMM yyyy')}
          </span>
        </div>
      )}

      <div
        className={`flex w-full mb-1 ${
          isOwn ? 'justify-end' : 'justify-start'
        }`}
      >
        <div
          className={`relative max-w-[75%] px-3 py-2 rounded-2xl ${
            isOwn
              ? 'bg-[#DCF8C6] text-black rounded-br-none'
              : 'bg-white text-black rounded-bl-none border border-gray-200'
          } shadow-sm`}
        >
          {/* Image Message */}
          {message.messageType === 'image' && message.fileUrl && (
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={message.fileUrl}
                alt="Shared"
                className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition"
                onClick={() => window.open(message.fileUrl, '_blank')}
              />
              {message.message && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-white text-sm">{message.message}</p>
                </div>
              )}
            </div>
          )}

          {/* File Message */}
          {message.messageType === 'file' && message.fileUrl && (
            <a
              href={message.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition"
            >
              {message.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <ImageIcon className="w-10 h-10 text-gray-600" />
              ) : (
                <FileText className="w-10 h-10 text-blue-600" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{message.fileName}</p>
                <p className="text-xs text-gray-500">{formatFileSize(message.fileSize)}</p>
              </div>
              <Download className="w-5 h-5 text-gray-500" />
            </a>
          )}

          {/* Text Message */}
          {message.messageType !== 'image' && message.messageType !== 'file' && message.message && (
            <p className="text-base break-words whitespace-pre-wrap">{message.message}</p>
          )}

          {/* Timestamp + Status */}
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-xs text-gray-500">{time}</span>
            {isOwn && isLastInGroup && <StatusIcon />}
          </div>

          {/* WhatsApp-style Tail */}
          {isLastInGroup && (
            <div
              className={`absolute bottom-0 w-3 h-3 ${
                isOwn
                  ? 'right-0 translate-x-[6px] -translate-y-[1px]'
                  : 'left-0 -translate-x-[6px] -translate-y-[1px]'
              }`}
            >
              <svg viewBox="0 0 8 13" width="8" height="13">
                <path
                  fill={isOwn ? '#DCF8C6' : 'white'}
                  d={
                    isOwn
                      ? 'M5.188 13c-.864 0-1.728-.39-2.275-1.17L0 7.875 2.92 13h2.268z'
                      : 'M2.812 13c.864 0 1.728-.39 2.275-1.17L8 7.875 5.08 13H2.812z'
                  }
                />
              </svg>
            </div>
          )}
        </div>
      </div>
    </>
  );
};