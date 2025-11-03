import React from 'react';
import ReactMarkdown from 'react-markdown';

interface AssessmentDisplayProps {
  assessment: string;
  isLoading: boolean;
  error: string | null;
}

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center space-y-4">
    <div className="w-12 h-12 border-4 border-t-orange-500 border-stone-200 rounded-full animate-spin"></div>
    <p className="text-slate-600 font-medium">AI đang phân tích bài làm của bạn...</p>
  </div>
);

const InitialState: React.FC = () => (
  <div className="text-center text-slate-500 p-8">
    <div className="text-5xl mb-4">🎓</div>
    <h3 className="text-xl font-semibold text-slate-700">Sẵn sàng nhận đánh giá!</h3>
    <p>Hoàn thành bài kiểm tra và nộp bài để nhận được phân tích chi tiết về năng lực của bạn từ AI nhé.</p>
  </div>
);

const AssessmentDisplay: React.FC<AssessmentDisplayProps> = ({ assessment, isLoading, error }) => {
  const renderContent = () => {
    if (isLoading) {
      return <LoadingSpinner />;
    }
    if (error) {
      return (
        <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg">
          <h3 className="font-bold">Đã xảy ra lỗi</h3>
          <p>{error}</p>
        </div>
      );
    }
    if (assessment) {
      return (
        <ReactMarkdown
          className="prose prose-slate max-w-none prose-headings:text-slate-800 prose-h3:font-bold prose-h3:text-xl prose-strong:text-slate-700"
          children={assessment}
        />
      );
    }
    return <InitialState />;
  };

  return (
    <div className="min-h-[200px] flex items-center justify-center">
      <div className="w-full">
        {renderContent()}
      </div>
    </div>
  );
};

export default AssessmentDisplay;