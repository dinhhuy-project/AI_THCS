export interface QuizQuestion {
  id: string;
  skill: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
}

export interface StudentAnswers {
  [questionId: string]: string; // e.g. { 'q1': 'A', 'q2': 'C' }
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

// FIX: Add missing ContentDifficulty enum and ContentItem interface to resolve import errors.
export enum ContentDifficulty {
  EASY = 'Dễ',
  MEDIUM = 'Trung bình',
  HARD = 'Khó',
}

export interface ContentItem {
  id: string;
  title: string;
  topic: string;
  relatedSkill: string;
  difficulty: ContentDifficulty;
  estimatedTime: number;
}