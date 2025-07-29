export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'teacher' | 'admin';
  grade?: string;
  subject?: string;
  preferences: {
    language: string;
    difficulty: string;
    subjects?: string[];
  };
  stats?: {
    testsCompleted: number;
    averageScore: number;
    totalQuestions: number;
    correctAnswers: number;
  };
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'teacher';
  grade?: string;
  subject?: string;
}

export interface Question {
  _id: string;
  title: string;
  content: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  grade: string;
  options?: QuestionOption[];
  correctAnswer?: string;
  points: number;
  explanation?: string;
  keywords?: string[];
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  isAIGenerated?: boolean;
  qualityScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionOption {
  text: string;
  isCorrect?: boolean;
  explanation?: string;
}

export interface QuestionData {
  title: string;
  content: string;
  type: string;
  subject: string;
  topic: string;
  difficulty: string;
  grade: string;
  options?: QuestionOption[];
  correctAnswer?: string;
  points?: number;
  explanation?: string;
  tags?: string[];
}

export interface GenerateQuestionData {
  prompt: string;
  subject: string;
  topic: string;
  difficulty: string;
  grade: string;
  type: string;
  count: number;
}

export interface Test {
  _id: string;
  title: string;
  description?: string;
  subject: string;
  grade: string;
  questions: TestQuestion[];
  totalPoints: number;
  timeLimit: number;
  attempts: number;
  startDate: string;
  endDate: string;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  settings?: {
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    showResults?: boolean;
    allowReview?: boolean;
    requirePassword?: boolean;
  };
  submissionStatus?: string;
  lastSubmission?: TestSubmission;
}

export interface TestQuestion {
  question: Question | string;
  points: number;
  order: number;
}

export interface TestData {
  title: string;
  description?: string;
  subject: string;
  grade: string;
  questions: Array<{
    question: string;
    points: number;
    order: number;
  }>;
  timeLimit: number;
  attempts?: number;
  startDate: string;
  endDate: string;
  settings?: Test['settings'];
}

export interface TestSubmission {
  _id: string;
  test: string | Test;
  student: string | User;
  answers: TestAnswer[];
  startTime: string;
  endTime?: string;
  timeSpent: number;
  score: number;
  percentage: number;
  status: 'started' | 'in-progress' | 'completed' | 'abandoned';
  attempt: number;
}

export interface TestAnswer {
  question: string;
  answer: string | string[] | boolean;
  isCorrect?: boolean;
  points?: number;
  timeSpent?: number;
}