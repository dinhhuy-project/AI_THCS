import React, { useEffect, useRef } from 'react';
import { Message as MessageType } from '../types';
import { Message } from './Message';
import { TypingIndicator } from './TypingIndicator';

interface ChatWindowProps {
  messages: MessageType[];
  isLoading: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
      {messages.map((msg, index) => (
        <Message key={index} message={msg} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};