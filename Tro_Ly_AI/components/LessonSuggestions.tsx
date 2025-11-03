
import React from 'react';

interface LessonSuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

export const LessonSuggestions: React.FC<LessonSuggestionsProps> = ({ suggestions, onSuggestionClick }) => {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="px-4 md:px-6 pb-2 pt-4 border-t border-gray-200">
      <h3 className="text-sm font-semibold text-teal-700 mb-2">Gợi ý cho em:</h3>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className="bg-white hover:bg-teal-100 border border-teal-200 text-teal-800 text-sm font-medium py-1.5 px-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};