import React, { useEffect, useRef } from 'react';
import type { Message } from '../types';
import { MessageBubble } from './Message';

interface ChatWindowProps {
  messages: Message[];
}

const WelcomeScreen: React.FC = () => (
    <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
        <div className="mb-4 text-6xl">🐾</div>
        <h1 className="text-2xl font-semibold text-gray-200">Welcome to A. me</h1>
        <p className="mt-2 max-w-md">
            Your personal AI companion is ready to listen.
            <br />
            Start by writing about your day, your thoughts, or anything on your mind.
        </p>
    </div>
);

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        {messages.length === 0 ? (
          <WelcomeScreen />
        ) : (
          messages.map((msg, index) => (
            <MessageBubble key={`${msg.id}-${index}`} message={msg} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
