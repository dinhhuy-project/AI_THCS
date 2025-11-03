
import React from 'react';

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center space-x-1.5 bg-white text-gray-800 rounded-b-2xl rounded-tr-2xl px-4 py-3 shadow-lg border border-gray-200">
       <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0 mr-3 bg-teal-200`}>
           🤖
       </div>
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  );
};