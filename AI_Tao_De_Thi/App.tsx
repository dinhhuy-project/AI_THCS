
import React, { useState, useCallback } from 'react';
import { QuizQuestion, StudentAnswers, ChatMessage } from './types';
import { evaluateQuiz, generateQuiz } from './services/geminiService';
import QuizView from './components/StudentProfileForm';
import AssessmentDisplay from './components/LearningPathDisplay';
import ChatInterface from './components/ChatInterface';
import { GoogleGenAI, Chat } from '@google/genai';
import FloatingIcons from './components/FloatingIcons';

const AITaoDeThi: React.FC = () => {
  // Quiz Generation State
  const [subjectInput, setSubjectInput] = useState('Toán học');
  const [gradeInput, setGradeInput] = useState('Lớp 9');
  const [topicInput, setTopicInput] = useState('Hệ thức Vi-et và ứng dụng');
  const [quizType, setQuizType] = useState<'Trắc nghiệm' | 'Tự luận'>('Trắc nghiệm');
  const [numQuestions, setNumQuestions] = useState(3);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  // Quiz Taking State
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<StudentAnswers>({});
  
  // Assessment State
  const [assessment, setAssessment] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Chat State
  const [chat, setChat] = useState<Chat | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleGenerateQuiz = async () => {
    if (!subjectInput || !gradeInput || !topicInput || numQuestions <= 0) {
      alert('Vui lòng điền đầy đủ thông tin để tạo đề thi.');
      return;
    }

    setIsGeneratingQuiz(true);
    setError(null);
    try {
      const questions = await generateQuiz(subjectInput, gradeInput, topicInput, quizType, numQuestions);
      if (questions.length > 0) {
        setCurrentQuiz(questions);
        setQuizStarted(true);
      } else {
        alert('AI không thể tạo đề thi với các thông tin được cung cấp. Vui lòng thử lại.');
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred during quiz generation.');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const resetQuiz = () => {
      setAnswers({});
      setAssessment('');
      setIsLoading(false);
      setError(null);
      setIsSubmitted(false);
      setQuizStarted(false);
      setChat(null);
      setChatHistory([]);
      setCurrentQuiz([]);
  };

  const handleAnswerChange = useCallback((questionId: string, answer: string) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  }, [isSubmitted]);

  const handleSubmitQuiz = useCallback(async () => {
    if (Object.keys(answers).length !== currentQuiz.length) {
      alert('Vui lòng trả lời hết tất cả các câu hỏi!');
      return;
    }

    setIsLoading(true);
    setIsSubmitted(true);
    setError(null);
    setAssessment('');

    try {
      const result = await evaluateQuiz(currentQuiz, answers, subjectInput, gradeInput);
      setAssessment(result);

      if (process.env.API_KEY) {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const systemInstruction = `Bạn là một trợ lý giáo viên AI, thân thiện và kiên nhẫn. Nhiệm vụ của bạn là trả lời các câu hỏi của học sinh dựa trên bài đánh giá và kế hoạch học tập đã được cung cấp. Luôn giữ giọng văn động viên, dễ hiểu. Đây là bài đánh giá của học sinh:\n\n${result}`;
        const newChat = ai.chats.create({ 
            model: 'gemini-2.5-flash',
            config: { systemInstruction }
        });
        setChat(newChat);
        setChatHistory([{ role: 'model', content: "Đây là đánh giá và kế hoạch học tập cho em. Nếu có bất kỳ câu hỏi nào, đừng ngần ngại hỏi nhé!" }]);
      }

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [answers, currentQuiz, subjectInput, gradeInput]);

  const handleSendChatMessage = async (userMessage: string) => {
    if (!chat || isChatLoading) return;

    setIsChatLoading(true);
    const updatedHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: userMessage }];
    setChatHistory(updatedHistory);

    try {
        const response = await chat.sendMessage(userMessage);
        const modelResponse = response.text;
        setChatHistory(prev => [...prev, { role: 'model', content: modelResponse }]);
    } catch (err) {
        console.error("Chat error:", err);
        setChatHistory(prev => [...prev, { role: 'model', content: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại." }]);
    } finally {
        setIsChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-800 font-sans overflow-hidden relative" style={{ background: 'radial-gradient(circle at top left, #81ecec, #74b9ff, #a29bfe)' }}>
      <div className="relative flex flex-col items-center justify-start min-h-screen py-12 px-4">
        
        <h1 className="text-4xl lg:text-5xl font-extrabold text-white text-center absolute top-8 z-20" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            AI Trợ Lý Học Tập
        </h1>
        
        <FloatingIcons />

        <div className="relative w-full max-w-6xl mt-36 lg:mt-40">
          <div className="bg-stone-100 rounded-lg shadow-2xl p-6 md:p-10 min-h-[60vh] relative z-10">
            {!quizStarted ? (
              <div className="max-w-xl mx-auto flex flex-col items-center justify-center min-h-[50vh]">
                <div className="bg-white/60 p-8 rounded-2xl space-y-6 text-center shadow-inner w-full">
                  <h2 className="text-3xl font-bold text-slate-800">Tạo đề thi</h2>
                  <div className="space-y-4 text-left">
                    <div>
                      <label htmlFor="subject-input" className="block text-sm font-medium text-slate-700 mb-1">Môn học</label>
                      <input id="subject-input" type="text" value={subjectInput} onChange={e => setSubjectInput(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500" placeholder="VD: Vật lí" />
                    </div>
                     <div>
                      <label htmlFor="grade-input" className="block text-sm font-medium text-slate-700 mb-1">Lớp</label>
                      <input id="grade-input" type="text" value={gradeInput} onChange={e => setGradeInput(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500" placeholder="VD: Lớp 10" />
                    </div>
                     <div>
                      <label htmlFor="topic-input" className="block text-sm font-medium text-slate-700 mb-1">Chủ đề/Chương</label>
                      <input id="topic-input" type="text" value={topicInput} onChange={e => setTopicInput(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500" placeholder="VD: Định luật II Newton" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="quiz-type" className="block text-sm font-medium text-slate-700 mb-1">Loại đề</label>
                            <select id="quiz-type" value={quizType} onChange={e => setQuizType(e.target.value as any)} className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500">
                                <option>Trắc nghiệm</option>
                                <option>Tự luận</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="num-questions" className="block text-sm font-medium text-slate-700 mb-1">Số câu</label>
                            <input id="num-questions" type="number" min="1" max="10" value={numQuestions} onChange={e => setNumQuestions(parseInt(e.target.value))} className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500" />
                        </div>
                    </div>
                  </div>
                  {error && <p className="text-red-600 bg-red-100 p-3 rounded-lg text-sm">{error}</p>}
                  <button
                    onClick={handleGenerateQuiz}
                    disabled={isGeneratingQuiz}
                    className="w-full flex items-center justify-center gap-3 py-3 px-6 text-lg font-semibold text-white bg-orange-500 rounded-xl shadow-lg hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-300 transition-all duration-300 transform hover:scale-105 disabled:bg-orange-300 disabled:cursor-not-allowed"
                  >
                    {isGeneratingQuiz ? 'Đang tạo đề...' : 'Tạo Đề Thi'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-12 items-start">
                <div className="space-y-6">
                  <QuizView 
                    questions={currentQuiz} 
                    answers={answers} 
                    onAnswerChange={handleAnswerChange}
                    isSubmitted={isSubmitted}
                  />
                  {!isSubmitted && (
                     <button
                      onClick={handleSubmitQuiz}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-3 py-4 px-6 text-lg font-semibold text-white bg-orange-500 rounded-xl shadow-lg hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-300 disabled:bg-orange-300 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100"
                    >
                      {isLoading ? 'Đang chấm điểm...' : 'Nộp bài và Nhận Đánh Giá'}
                    </button>
                  )}
                  {isSubmitted && (
                     <button
                      onClick={resetQuiz}
                      className="w-full flex items-center justify-center gap-3 py-3 px-6 text-lg font-semibold text-orange-700 bg-orange-100 rounded-xl shadow-lg hover:bg-orange-200 focus:outline-none focus:ring-4 focus:ring-orange-300 transition-all duration-300"
                    >
                      Làm bài kiểm tra khác
                    </button>
                  )}
                </div>
                
                <div className="space-y-8 lg:mt-16">
                  {(isLoading || isSubmitted) && (
                    <AssessmentDisplay assessment={assessment} isLoading={isLoading} error={error} />
                  )}
                  {isSubmitted && !isLoading && !error && (
                    <ChatInterface 
                        history={chatHistory} 
                        onSendMessage={handleSendChatMessage}
                        isLoading={isChatLoading} 
                    />
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="absolute inset-x-0 bottom-[-15px] h-[30px] bg-[#c62828] rounded-b-lg shadow-lg z-[5]"></div>
          <div className="absolute left-1/2 -translate-x-1/2 bottom-[-15px] w-20 h-[35px] bg-[#a52a2a] rounded-b-md z-[6]"></div>
        </div>
      </div>
    </div>
  );
}

export default AITaoDeThi;