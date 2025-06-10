export type QuestionType = "multiple-choice" | "true-false" | "short-answer";
export type DifficultyLevel = "easy" | "medium" | "hard";
export type AssessmentType = "pretest" | "posttest" | "activity";

export type QuestionDifficulty = "easy" | "medium" | "hard";

export interface Question {
  _id: string;
  text: string;
  type: QuestionType;
  assessmentType: AssessmentType;
  difficulty: QuestionDifficulty;
  options?: string[];
  correctAnswer: number;
  explanation: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentResult {
  _id: string;
  userId: string;
  userName: string;
  userType: string;
  school: string;
  major: string;
  questionId: string;
  questionText: string;
  userAnswer: string;
  isCorrect: boolean;
  score: number;
  timeSpent: number;
  completedAt: string;
  assessmentType: AssessmentType;
  submitted: boolean;
  skillAnswers: Record<string, number>;
}

export interface AssessmentStats {
  totalQuestions: number;
  totalAttempts: number;
  averageScore: number;
  completionRate: number;
  averageTimeSpent: number;
  totalStudents: number;
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  questionTypeDistribution: {
    "multiple-choice": number;
    "true-false": number;
    "short-answer": number;
  };
}

export interface ActivityProgress {
  _id: string;
  userId: string;
  userName: string;
  activityId: string;
  activityName: string;
  status: "not-started" | "in-progress" | "completed";
  progress: number;
  lastAccessed: string;
  completedAt?: string;
} 