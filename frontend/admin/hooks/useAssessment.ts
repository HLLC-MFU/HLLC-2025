import { useReducer, useCallback } from 'react';
import { Question, AssessmentResult, AssessmentStats, ActivityProgress, AssessmentType } from '@/types/assessment';
import { mockQuestions, mockResults, mockStats, mockActivityProgress } from '@/mocks/assessmentData';

// Types for our state
interface AssessmentState {
  data: {
    questions: Question[];
    results: AssessmentResult[];
    stats: AssessmentStats;
    activityProgress: ActivityProgress[];
  };
  loading: boolean;
  error: string | null;
}

// Action types
type AssessmentAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Partial<AssessmentState['data']> }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'RESET_ERROR' };

// Initial state
const initialState: AssessmentState = {
  data: {
    questions: [],
    results: [],
    stats: {
      totalQuestions: 0,
      totalAttempts: 0,
      averageScore: 0,
      completionRate: 0,
      averageTimeSpent: 0,
      totalStudents: 0,
      difficultyDistribution: { easy: 0, medium: 0, hard: 0 },
      questionTypeDistribution: { "multiple-choice": 0, "true-false": 0, "short-answer": 0 }
    } as AssessmentStats,
    activityProgress: [],
  },
  loading: false,
  error: null,
};

// Reducer function
function assessmentReducer(state: AssessmentState, action: AssessmentAction): AssessmentState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        loading: false,
        data: { ...state.data, ...action.payload },
      };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'RESET_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

// Mock service functions
const assessmentService = {
  async fetchQuestions(type?: AssessmentType) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return type 
      ? mockQuestions.filter(q => q.assessmentType === type)
      : mockQuestions;
  },

  async createQuestion(questionData: Partial<Question>) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newQuestion: Question = {
      _id: `q${mockQuestions.length + 1}`,
      text: questionData.text || "",
      type: questionData.type || "multiple-choice",
      options: questionData.options || [],
      correctAnswer: questionData.correctAnswer || 0,
      difficulty: questionData.difficulty || "easy",
      assessmentType: questionData.assessmentType || "pretest",
      explanation: questionData.explanation || "",
      isActive: questionData.isActive !== undefined ? questionData.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockQuestions.push(newQuestion);
    return newQuestion;
  },

  async updateQuestion(questionId: string, questionData: Partial<Question>) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = mockQuestions.findIndex(q => q._id === questionId);
    if (index === -1) throw new Error("Question not found");
    
    const updatedQuestion = {
      ...mockQuestions[index],
      ...questionData,
      updatedAt: new Date().toISOString(),
    };
    mockQuestions[index] = updatedQuestion;
    return updatedQuestion;
  },

  async deleteQuestion(questionId: string) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = mockQuestions.findIndex(q => q._id === questionId);
    if (index === -1) throw new Error("Question not found");
    mockQuestions.splice(index, 1);
    return questionId;
  },

  async fetchResults(type: AssessmentType) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockResults.filter(r => r.assessmentType === type);
  },

  async fetchStats(type: AssessmentType) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockStats[type] || {
      totalQuestions: 0,
      totalAttempts: 0,
      averageScore: 0,
      completionRate: 0,
      averageTimeSpent: 0,
      totalStudents: 0,
      difficultyDistribution: { easy: 0, medium: 0, hard: 0 },
      questionTypeDistribution: { "multiple-choice": 0, "true-false": 0, "short-answer": 0 }
    };
  },

  async fetchActivityProgress() {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockActivityProgress;
  },
};

export function useAssessment() {
  const [state, dispatch] = useReducer(assessmentReducer, initialState);

  // Generic fetch handler
  const handleFetch = useCallback(async <T>(
    fetchFn: () => Promise<T>,
    updateKey: keyof AssessmentState['data']
  ) => {
    dispatch({ type: 'FETCH_START' });
    try {
      const data = await fetchFn();
      dispatch({ 
        type: 'FETCH_SUCCESS', 
        payload: { [updateKey]: data } 
      });
      return data;
    } catch (err: any) {
      const errorMessage = err.message || "An error occurred";
      dispatch({ type: 'FETCH_ERROR', payload: errorMessage });
      throw err;
    }
  }, []);

  // Question operations
  const fetchQuestions = useCallback((type?: AssessmentType) => 
    handleFetch(() => assessmentService.fetchQuestions(type), 'questions'), 
    [handleFetch]
  );

  const createQuestion = useCallback(async (questionData: Partial<Question>) => {
    dispatch({ type: 'FETCH_START' });
    try {
      const newQuestion = await assessmentService.createQuestion(questionData);
      dispatch({ 
        type: 'FETCH_SUCCESS', 
        payload: { 
          questions: [...state.data.questions, newQuestion] 
        } 
      });
      return newQuestion;
    } catch (err: any) {
      dispatch({ 
        type: 'FETCH_ERROR', 
        payload: err.message || "Failed to create question" 
      });
      throw err;
    }
  }, [state.data.questions]);

  const updateQuestion = useCallback(async (questionId: string, questionData: Partial<Question>) => {
    dispatch({ type: 'FETCH_START' });
    try {
      const updatedQuestion = await assessmentService.updateQuestion(questionId, questionData);
      dispatch({ 
        type: 'FETCH_SUCCESS', 
        payload: { 
          questions: state.data.questions.map(q => 
            q._id === questionId ? updatedQuestion : q
          ) 
        } 
      });
      return updatedQuestion;
    } catch (err: any) {
      dispatch({ 
        type: 'FETCH_ERROR', 
        payload: err.message || "Failed to update question" 
      });
      throw err;
    }
  }, [state.data.questions]);

  const deleteQuestion = useCallback(async (questionId: string) => {
    dispatch({ type: 'FETCH_START' });
    try {
      await assessmentService.deleteQuestion(questionId);
      dispatch({ 
        type: 'FETCH_SUCCESS', 
        payload: { 
          questions: state.data.questions.filter(q => q._id !== questionId) 
        } 
      });
    } catch (err: any) {
      dispatch({ 
        type: 'FETCH_ERROR', 
        payload: err.message || "Failed to delete question" 
      });
      throw err;
    }
  }, [state.data.questions]);

  // Results and stats operations
  const fetchResults = useCallback((type: AssessmentType) => 
    handleFetch(() => assessmentService.fetchResults(type), 'results'), 
    [handleFetch]
  );

  const fetchStats = useCallback((type: AssessmentType) => 
    handleFetch(() => assessmentService.fetchStats(type), 'stats'), 
    [handleFetch]
  );

  const fetchActivityProgress = useCallback(() => 
    handleFetch(() => assessmentService.fetchActivityProgress(), 'activityProgress'), 
    [handleFetch]
  );

  return {
    // State
    ...state.data,
    loading: state.loading,
    error: state.error,

    // Question operations
    fetchQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,

    // Results and stats operations
    fetchResults,
    fetchStats,
    fetchActivityProgress,
  };
} 