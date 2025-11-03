import React from 'react';
import { QuizQuestion, StudentAnswers } from '../types';

interface QuizViewProps {
  questions: QuizQuestion[];
  answers: StudentAnswers;
  onAnswerChange: (questionId: string, answer: string) => void;
  isSubmitted: boolean;
}

const QuizView: React.FC<QuizViewProps> = ({ questions, answers, onAnswerChange, isSubmitted }) => {
  const getOptionClassName = (question: QuizQuestion, option: string) => {
    if (!isSubmitted) return "hover:bg-amber-100";

    const isCorrect = option === question.correctAnswer;
    const isSelected = answers[question.id] === option;

    if (isCorrect) return "bg-green-200 border-green-500";
    if (isSelected && !isCorrect) return "bg-red-200 border-red-500";
    return "bg-stone-50";
  };
  
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-slate-800 text-center">Bài kiểm tra năng lực</h2>
      <form>
        {questions.map((q, index) => (
          <div key={q.id} className="py-6 border-b border-stone-200 last:border-b-0">
            <p className="font-semibold text-slate-800 mb-1">
              Câu {index + 1}: <span className="font-normal">{q.questionText}</span>
            </p>
            <p className="text-sm text-orange-600 font-medium mb-4">Lĩnh vực: {q.skill}</p>
            
            {q.options && q.options.length > 0 ? (
              <div className="space-y-3">
                {q.options.map(option => (
                   <label 
                    key={option}
                    className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${getOptionClassName(q, option)}`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={option}
                      checked={answers[q.id] === option}
                      onChange={(e) => onAnswerChange(q.id, e.target.value)}
                      className="h-4 w-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                      disabled={isSubmitted}
                    />
                    <span className="ml-3 text-sm font-medium text-slate-700">{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div>
                <textarea
                  name={q.id}
                  value={answers[q.id] || ''}
                  onChange={(e) => onAnswerChange(q.id, e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                  rows={6}
                  placeholder="Nhập câu trả lời của bạn ở đây..."
                  disabled={isSubmitted}
                />
                 {isSubmitted && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-semibold text-blue-800">Gợi ý đáp án:</p>
                        <p className="text-sm text-slate-700">{q.correctAnswer}</p>
                    </div>
                )}
              </div>
            )}
          </div>
        ))}
      </form>
    </div>
  );
};

export default QuizView;