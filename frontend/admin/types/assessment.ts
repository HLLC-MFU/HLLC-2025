export type QuestionType = "text" | "rating" | "dropdown" | "checkbox" | "radio";
export type DifficultyLevel = "easy" | "medium" | "hard";
export type AssessmentType = "pretest" | "posttest" | "activity";

export type QuestionDifficulty = "easy" | "medium" | "hard";

export interface Question {
  _id: string;
  type: QuestionType;
  question: {
    en: string;
    th: string;
  };
  order: number;
  banner: string | null;
  createdAt: string;
  updatedAt: string;
  assessmentType?: AssessmentType; // Optional since it's not in the API response
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
    text: number;
    rating: number;
    dropdown: number;
    checkbox: number;
    radio: number;
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

export interface TestAnswer {
    _id: string;
    userId: string;
    questionId: string;
    answer: string | string[] | number;
    createdAt: string;
    updatedAt: string;
    user?: {
        name: string;
        school?: string;
        major?: string;
        userType?: string;
    };
    question?: {
        type: string;
        difficulty?: string;
    };
}

export interface TestAnswersResponse {
    data: TestAnswer[];
    message: string;
}

export interface PreTestState {
    questions: Question[];
    results: AssessmentResult[];
    stats: AssessmentStats;
    answers: TestAnswer[];
}

export interface PostTestState {
    questions: Question[];
    results: AssessmentResult[];
    stats: AssessmentStats;
    answers: TestAnswer[];
}

// Component Props Types
export interface AssessmentOverviewDashboardProps {
    type: AssessmentType;
    answers: TestAnswer[];
    loading: boolean;
}

export interface QuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (questionData: Partial<Question>) => void;
    question: Question | null;
    type: AssessmentType;
}

export interface QuestionTableProps {
    questions: Question[];
    type: AssessmentType;
    onEdit: (question: Question) => void;
    onDelete: (questionId: string) => void;
    onView: (question: Question) => void;
    onAdd: () => void;
}

// Student Details Types
export interface StudentDetail {
    userId: string;
    name: string;
    school?: string;
    major?: string;
    score: number;
    timeSpent: number;
    completed: boolean;
    completedQuestions: number;
    lastUpdated: Date;
}

export interface UserDetails {
    userId: string;
    name: string;
    school?: string;
    major?: string;
    scores: number[];
    timeSpent: number[];
    answerCount: number;
    lastUpdated: Date;
}

// Statistics Types
export interface ScoreDistribution {
    range: string;
    count: number;
}

export interface DifficultyDistribution {
    easy: number;
    medium: number;
    hard: number;
}

export interface QuestionTypeDistribution {
    text: number;
    rating: number;
    dropdown: number;
    checkbox: number;
    radio: number;
}

export interface AssessmentStats {
    totalStudents: number;
    totalAttempts: number;
    averageScore: number;
    completionRate: number;
    averageTimeSpent: number;
    difficultyDistribution: DifficultyDistribution;
    questionTypeDistribution: QuestionTypeDistribution;
    scoreDistribution: ScoreDistribution[];
    studentDetails: StudentDetail[];
}

// UI Types
export type ChipColor = "primary" | "secondary" | "success" | "warning" | "danger" | "default";

export interface QuestionTypeOption {
    value: QuestionType;
    label: string;
    color: ChipColor;
}

// Mock Data Types
export interface MockFilterData {
    userTypes: string[];
    schools: string[];
    majors: string[];
} 