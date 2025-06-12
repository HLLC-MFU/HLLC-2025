import { useReducer, useCallback } from 'react';
import { Question, ActivityProgress } from '@/types/assessment';

// API base URL - should be configured in environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Types for our state
interface AssessmentState {
  data: {
    questions: Question[];
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

// API service functions
const assessmentService = {
  async fetchQuestions(activityId: string) {
    const response = await fetch(`${API_BASE_URL}/assessments/${activityId}/activity`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch activity questions: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  },

  async createQuestion(activityId: string, questionData: Partial<Question>) {
    const response = await fetch(`${API_BASE_URL}/assessments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        ...questionData,
        activity: activityId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create activity question: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  },

  async updateQuestion(questionId: string, questionData: Partial<Question>) {
    const response = await fetch(`${API_BASE_URL}/assessments/${questionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(questionData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update activity question: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  },

  async deleteQuestion(questionId: string) {
    const response = await fetch(`${API_BASE_URL}/assessments/${questionId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete activity question: ${response.statusText}`);
    }

    const data = await response.json();
    return data.id;
  },

  async fetchActivityProgress(activityId: string) {
    const response = await fetch(`${API_BASE_URL}/assessments/${activityId}/progress`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch activity progress: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
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
  const fetchQuestions = useCallback((activityId: string) => 
    handleFetch(() => assessmentService.fetchQuestions(activityId), 'questions'), 
    [handleFetch]
  );

  const createQuestion = useCallback(async (activityId: string, questionData: Partial<Question>) => {
    dispatch({ type: 'FETCH_START' });
    try {
      const newQuestion = await assessmentService.createQuestion(activityId, questionData);
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

  // Activity progress operations
  const fetchActivityProgress = useCallback((activityId: string) => 
    handleFetch(() => assessmentService.fetchActivityProgress(activityId), 'activityProgress'), 
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

    // Activity progress operations
    fetchActivityProgress,
  };
} 