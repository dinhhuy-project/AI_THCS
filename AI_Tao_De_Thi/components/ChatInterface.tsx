import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';

interface ChatInterfaceProps {
  history: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const TypingIndicator: React.FC = () => (
  <div className="flex items-center space-x-2">
    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
  </div>
);

const ChatInterface: React.FC<ChatInterfaceProps> = ({ history, onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom();
  }, [history, isLoading]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="bg-white/60 rounded-2xl shadow-inner border border-stone-200/80 flex flex-col h-[500px]">
      <div className="p-4 border-b border-stone-200 flex items-center gap-3">
        <span className="text-2xl">🤖</span>
        <h3 className="text-lg font-bold text-slate-800">Trò chuyện với Trợ lý AI</h3>
      </div>
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {history.map((msg, index) => (
          <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-orange-400 flex-shrink-0"></div>}
            <div
              className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${
                msg.role === 'user'
                  ? 'bg-orange-500 text-white rounded-br-none'
                  : 'bg-white text-slate-800 rounded-bl-none'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex items-end gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-orange-400 flex-shrink-0"></div>
                <div className="bg-white text-slate-800 rounded-2xl rounded-bl-none p-3">
                    <TypingIndicator />
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="p-4 border-t border-stone-200 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập câu hỏi của bạn..."
          className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-5 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed transition"
        >
          Gửi
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;