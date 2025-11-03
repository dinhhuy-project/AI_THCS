
import React, { useState, useRef, useEffect } from 'react';
import { SendIcon } from './icons/SendIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { StopIcon } from './icons/StopIcon';


interface ChatInputProps {
  onSendMessage: (text: string, image?: File) => void;
  isLoading: boolean;
  isVoiceSessionActive: boolean;
  onStartVoice: () => void;
  onStopVoice: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, isVoiceSessionActive, onStartVoice, onStopVoice }) => {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${scrollHeight}px`;
    }
  }, [text]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAttachClick = () => {
      fileInputRef.current?.click();
  };
  
  const removeImage = () => {
      setImageFile(null);
      setImagePreview(null);
      if(fileInputRef.current) {
          fileInputRef.current.value = "";
      }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((text.trim() || imageFile) && !isLoading && !isVoiceSessionActive) {
      onSendMessage(text, imageFile);
      setText('');
      removeImage();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
    }
  }

  const handleVoiceToggle = () => {
    if(isVoiceSessionActive) {
        onStopVoice();
    } else {
        onStartVoice();
    }
  }

  const isDisabled = isLoading || isVoiceSessionActive;
  const showSendButton = text.trim().length > 0 || imageFile;

  return (
    <div className="bg-teal-50 pt-2 pb-4">
        {imagePreview && (
          <div className="relative inline-block mb-2 ml-2">
              <img src={imagePreview} alt="Xem trước" className="max-h-24 rounded-lg border-2 border-white shadow-md" />
              <button onClick={removeImage} className="absolute top-0 right-0 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold -mt-2 -mr-2 transition-all" aria-label="Xóa ảnh">&times;</button>
          </div>
      )}
        <form onSubmit={handleSubmit} className="flex items-end space-x-3 w-full">
            <div className="flex-1 flex items-center bg-white rounded-full border border-teal-200 shadow-sm transition-all duration-300 focus-within:ring-2 focus-within:ring-teal-400 p-1">
                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                <button type="button" onClick={handleAttachClick} disabled={isDisabled} className="text-gray-400 hover:text-teal-600 disabled:text-gray-300 disabled:cursor-not-allowed p-2 transition-colors rounded-full hover:bg-gray-100" aria-label="Đính kèm ảnh">
                    <PaperclipIcon />
                </button>
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isVoiceSessionActive ? "Đang lắng nghe..." : (imagePreview ? "Nhờ cô xem giúp em sai ở đâu nhé..." : "Em có câu hỏi gì không?...")}
                    className="flex-1 bg-transparent text-gray-800 placeholder-gray-500 focus:outline-none resize-none max-h-48 px-2 py-2"
                    rows={1}
                    disabled={isDisabled}
                />
                 {showSendButton && (
                    <button
                        type="submit"
                        disabled={isDisabled}
                        className="bg-teal-500 text-white rounded-full p-2.5 hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 scale-100"
                        aria-label="Gửi tin nhắn"
                    >
                        <SendIcon />
                    </button>
                 )}
            </div>
             <button
                type="button"
                onClick={handleVoiceToggle}
                disabled={isLoading && !isVoiceSessionActive}
                className={`p-3 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 text-white flex-shrink-0
                    ${isVoiceSessionActive 
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                        : 'bg-teal-500 hover:bg-teal-600'
                    }
                    ${isLoading && !isVoiceSessionActive ? 'bg-gray-300 cursor-not-allowed' : ''}`}
                aria-label={isVoiceSessionActive ? "Dừng trò chuyện" : "Bắt đầu trò chuyện bằng giọng nói"}
            >
                {isVoiceSessionActive ? <StopIcon /> : <MicrophoneIcon />}
            </button>
        </form>
    </div>
  );
};
