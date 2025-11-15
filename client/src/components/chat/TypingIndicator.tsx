// src/components/chat/TypingIndicator.tsx
import React from 'react';

interface Props {
  names: string[];
}

export const TypingIndicator: React.FC<Props> = ({ names }) => {
  if (names.length === 0) return null;
  const text = names.length === 1 ? `${names[0]} is typing` : 'Several people are typing';

  return (
    <div className="px-4 py-2 text-sm text-gray-600 italic">
      {text}
      <span className="inline-block animate-pulse">...</span>
    </div>
  );
};