export type QuestionType = "text" | "rating" | "dropdown" | "checkbox" | "radio";
export type DifficultyLevel = "easy" | "medium" | "hard";
export type AssessmentType = "pretest" | "posttest" | "activity";
export type DisplayType = "both" | "pretest" | "posttest";

export type QuestionDifficulty = "easy" | "medium" | "hard";

export interface Activity {
  _id: string;
  name: {
    en: string;
    th: string;
  };
  acronym: string;
  fullDetails: {
    en: string;
    th: string;
  };
  shortDetails: {
    en: string;
    th: string;
  };
  type: string;
  photo: {
    bannerPhoto: string;
  };
  location: {
    en: string;
    th: string;
  };
  metadata: {
    isOpen: boolean;
    isProgressCount: boolean;
    isVisible: boolean;
    scope: {
      major: string[];
      school: string[];
      user: string[];
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  _id: string;
  type: QuestionType;
  displayType?: DisplayType; // Optional for backward compatibility
  question: {
    en: string;
    th: string;
  };
  order: number;
  banner: string | null;
  createdAt: string;
  updatedAt: string;
  assessmentType?: AssessmentType; // Optional since it's not in the API response
  activityId?: string; // Optional field to link question to a specific activity
  activity?: Activity; // The full activity object from the API
  difficulty?: DifficultyLevel; // Added difficulty level
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
  // Additional fields for filtering
  userType?: string;
  school?: string;
  major?: string;
}

export interface TestAnswer {
    _id: string;
    userId: string;
    questionId: string;
    answer: string | number | string[];
    isCorrect?: boolean;
    createdAt: string;
    updatedAt: string;
    user?: {
        _id?: string;
        name?: {
            first: string;
            middle?: string;
            last: string;
        } | string;
        userType?: string;
        username?: string;
        role?: string;
        metadata?: {
            major?: {
                _id: string;
                name: {
                    th: string;
                    en: string;
                };
                school?: {
                    name: {
                        th: string;
                        en: string;
                    };
                };
            };
        };
        school?: string;
        major?: string;
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
export type AssessmentOverviewDashboardProps = {
    type: AssessmentType;
    loading?: boolean;
    answers?: TransformedAnswer[];
    questions?: Question[];
};

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
    username: string;
    name: string;
    school?: string;
    major?: string;
    score: number;
    timeSpent: number;
    completed: boolean;
    completedQuestions: number;
    totalQuestions: number;
    lastUpdated: Date;
    skillRatings?: Record<string, number | string>;
}

export interface UserDetails {
    userId: string;
    name: {
        first: string;
        middle?: string;
        last: string;
    } | string;
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
    majors: { name: string; school: string }[];
}

export interface UserInAnswer {
    _id: string;
    name: {
        first: string;
        middle?: string;
        last: string;
    };
    username: string;
    role: string;
    metadata: {
        major: {
            _id: string;
            name: {
                th: string;
                en: string;
            };
            school: {
                _id: string;
                name: {
                    th: string;
                    en: string;
                };
            };
        };
    };
    createdAt: string;
    updatedAt: string;
}

export interface RawPosttestAnswer {
    _id: string;
    user: UserInAnswer;
    answers: Array<{
        posttest: string; // This is the question ID for posttest
        answer: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

export interface RawPretestAnswer {
    _id: string;
    user: UserInAnswer;
    answers: Array<{
        pretest: string; // This is the question ID for pretest
        answer: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

export interface APIResponse<T> {
    data: T;
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        lastUpdatedAt: string;
    };
    message: string;
}

// Add new types for transformed answers
export interface TransformedAnswer {
    _id: string;
    userId: string;
    questionId: string;
    answer: string;
    createdAt: string;
    updatedAt: string;
    user: {
        _id: string;
        name: {
            first: string;
            middle?: string;
            last: string;
        } | string;
        username: string;
        userType: string;
        metadata: {
            major: {
                _id: string;
                name: {
                    th: string;
                    en: string;
                };
                school?: {
                    name: {
                        th: string;
                        en: string;
                    };
                };
            };
        };
        school?: string;
        major?: string;
    };
} 