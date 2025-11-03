
import React, { useState, useEffect, useRef, useCallback } from 'react';
// FIX: Removed LiveSession as it is not an exported member of '@google/genai'.
import { Chat, Part, GoogleGenAI, Modality, Blob } from '@google/genai';
import { ChatWindow } from './components/ChatWindow';
import { ChatInput } from './components/ChatInput';
import { LessonSuggestions } from './components/LessonSuggestions';
import { Message } from './types';
import { createChatSession, ai } from './services/geminiService';
import { WELCOME_MESSAGE } from './constants';
import { encode, decode, decodeAudioData } from './utils/audio';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// FIX: Inferred LiveSession type from the return type of ai.live.connect
type LiveSession = Awaited<ReturnType<typeof ai['live']['connect']>>;

const TroLyAI: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: WELCOME_MESSAGE },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceSessionActive, setIsVoiceSessionActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lessonSuggestions, setLessonSuggestions] = useState<string[]>([]);
  
  const chatRef = useRef<Chat | null>(null);
  const liveSessionRef = useRef<LiveSession | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    try {
      chatRef.current = createChatSession();
    } catch (e) {
      setError('Không thể khởi tạo AI. Vui lòng kiểm tra API key.');
      console.error(e);
    }
     // Cleanup on unmount
    return () => {
      stopVoiceSession();
    };
  }, []);

  const handleSendMessage = useCallback(async (text: string, image?: File) => {
    if (isLoading || (!text.trim() && !image)) return;

    const userMessage: Message = { role: 'user', content: text };
    let imageBase64: string | undefined;

    if (image) {
      try {
        imageBase64 = await fileToBase64(image);
        userMessage.image = imageBase64;
      } catch (e) {
        setError("Không thể đọc file ảnh. Vui lòng thử lại.");
        console.error(e);
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    setLessonSuggestions([]);
    setMessages((prev) => [...prev, userMessage, { role: 'model', content: '' }]);

    if (!chatRef.current) {
      setError('Phiên trò chuyện chưa được khởi tạo.');
      setIsLoading(false);
      return;
    }

    try {
      const parts: Part[] = [];
      let promptText = text;

      if (image && !text.trim()) {
        promptText = "Phân tích hình ảnh này và giải thích từng bước nếu có bài tập. Nếu không, hãy mô tả nội dung của nó.";
      }
      
      if (image && imageBase64) {
          const base64Data = imageBase64.split(',')[1];
          parts.push({
              inlineData: {
                  mimeType: image.type,
                  data: base64Data,
              },
          });
      }
      parts.push({ text: promptText });

      // FIX: The sendMessageStream method expects an object with a 'message' property.
      const stream = await chatRef.current.sendMessageStream({ message: parts });
      let fullResponse = '';
      for await (const chunk of stream) {
        fullResponse += chunk.text;
        
        let displayContent = fullResponse;
        const suggestionMarker = '[SUGGESTIONS]';
        const suggestionIndex = fullResponse.indexOf(suggestionMarker);
        
        if (suggestionIndex !== -1) {
            displayContent = fullResponse.substring(0, suggestionIndex).trim();
            const suggestionsText = fullResponse.substring(suggestionIndex + suggestionMarker.length).trim();
            const newSuggestions = suggestionsText.split('\n').filter(s => s.trim() !== '');
            setLessonSuggestions(newSuggestions);
        }

        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = displayContent;
          return newMessages;
        });
      }
    } catch (e) {
      const errorMessage = 'Oops! Có lỗi xảy ra. Vui lòng thử lại sau ít phút nhé.';
      setError(errorMessage);
      setMessages((prev) => {
          const newMessages = [...prev];
          if(newMessages[newMessages.length - 1].role === 'model') {
            newMessages[newMessages.length - 1].content = errorMessage;
          } else {
            newMessages.push({ role: 'model', content: errorMessage });
          }
          return newMessages;
      });
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);
  
  const startVoiceSession = useCallback(async () => {
      if (isVoiceSessionActive) return;
      setError(null);
      setIsLoading(true);
      setLessonSuggestions([]);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        nextStartTimeRef.current = 0;
        sourcesRef.current.clear();
        
        setMessages(prev => [...prev, {role: 'user', content: ''}, {role: 'model', content: ''}]);

        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                inputAudioTranscription: {},
                outputAudioTranscription: {},
            },
            callbacks: {
                onopen: () => {
                    const source = audioContextRef.current!.createMediaStreamSource(stream);
                    const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
                    scriptProcessorRef.current = scriptProcessor;

                    scriptProcessor.onaudioprocess = (event) => {
                        const inputData = event.inputBuffer.getChannelData(0);
                        // FIX: Replaced inefficient .map() with a for loop for audio processing.
                        const l = inputData.length;
                        const int16 = new Int16Array(l);
                        for (let i = 0; i < l; i++) {
                            int16[i] = inputData[i] * 32768;
                        }
                        const pcmBlob: Blob = {
                            data: encode(int16.buffer),
                            mimeType: 'audio/pcm;rate=16000',
                        };
                         sessionPromise.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
                    };

                    source.connect(scriptProcessor);
                    scriptProcessor.connect(audioContextRef.current!.destination);
                    setIsVoiceSessionActive(true);
                    setIsLoading(false);
                },
                onmessage: async (message) => {
                    if(message.serverContent?.inputTranscription) {
                        const text = message.serverContent.inputTranscription.text;
                        setMessages(prev => {
                            const newMessages = [...prev];
                            newMessages[newMessages.length - 2].content = text;
                            return newMessages;
                        });
                    }
                    if(message.serverContent?.outputTranscription) {
                        const text = message.serverContent.outputTranscription.text;
                         setMessages(prev => {
                            const newMessages = [...prev];
                            newMessages[newMessages.length - 1].content = text;
                            return newMessages;
                        });
                    }

                    const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if(audioData) {
                         const outputContext = outputAudioContextRef.current!;
                         nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputContext.currentTime);
                         const audioBuffer = await decodeAudioData(decode(audioData), outputContext, 24000, 1);
                         const source = outputContext.createBufferSource();
                         source.buffer = audioBuffer;
                         source.connect(outputContext.destination);
                         source.addEventListener('ended', () => {
                           sourcesRef.current.delete(source);
                         });
                         source.start(nextStartTimeRef.current);
                         nextStartTimeRef.current += audioBuffer.duration;
                         sourcesRef.current.add(source);
                    }
                    
                    if(message.serverContent?.turnComplete) {
                        setMessages(prev => {
                            const newMessages = [...prev];
                            if(newMessages[newMessages.length - 2].content.trim() !== '' || newMessages[newMessages.length - 1].content.trim() !== '') {
                                return [...newMessages, {role: 'user', content: ''}, {role: 'model', content: ''}];
                            }
                            return newMessages;
                        });
                    }
                },
                onclose: () => {
                    stopVoiceSession();
                },
                onerror: (e) => {
                    console.error(e);
                    setError("Lỗi kết nối giọng nói. Vui lòng thử lại.");
                    stopVoiceSession();
                }
            }
        });
        
        liveSessionRef.current = await sessionPromise;

      } catch (err) {
          setError("Không thể truy cập micro. Vui lòng cấp quyền và thử lại.");
          console.error(err);
          setIsLoading(false);
      }
  }, [isVoiceSessionActive]);


  const stopVoiceSession = useCallback(() => {
    if (!isVoiceSessionActive) return;
    setIsVoiceSessionActive(false);
    setIsLoading(false);

    liveSessionRef.current?.close();
    liveSessionRef.current = null;
    
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    mediaStreamRef.current = null;
    
    scriptProcessorRef.current?.disconnect();
    scriptProcessorRef.current = null;

    audioContextRef.current?.close();
    audioContextRef.current = null;
    
    outputAudioContextRef.current?.close();
    outputAudioContextRef.current = null;

    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();
    
     setMessages(prev => {
        const newMessages = [...prev];
        // Remove empty placeholders at the end
        if (newMessages.length >= 2 && newMessages[newMessages.length - 1].content === '' && newMessages[newMessages.length - 2].content === '') {
            newMessages.pop();
            newMessages.pop();
        }
        return newMessages;
    });

  }, [isVoiceSessionActive]);

  return (
    <div className="flex flex-col bg-teal-50 text-gray-800 font-sans" style={{height: '90vh'}}>
      <header className="bg-teal-100 shadow-md p-4">
        <h1 className="text-xl font-bold text-center text-teal-800">📝 Trợ lý học tập AI</h1>
        <p className="text-center text-sm text-teal-700">Người bạn đồng hành của học sinh THCS</p>
      </header>
      <ChatWindow messages={messages} isLoading={isLoading} />
      {!isLoading && lessonSuggestions.length > 0 && (
        <LessonSuggestions 
          suggestions={lessonSuggestions}
          onSuggestionClick={(suggestion) => handleSendMessage(suggestion)}
        />
      )}
      <div className="px-4 pt-4 bg-teal-50">
         {error && <p className="text-red-600 text-center text-sm mb-2">{error}</p>}
        <ChatInput 
          onSendMessage={handleSendMessage} 
          isLoading={isLoading} 
          isVoiceSessionActive={isVoiceSessionActive}
          onStartVoice={startVoiceSession}
          onStopVoice={stopVoiceSession}
          />
      </div>
    </div>
  );
};

export default TroLyAI;
