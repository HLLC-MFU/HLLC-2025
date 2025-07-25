import { useReducer, useCallback, useEffect } from 'react';
import { Question, ActivityProgress, RawPretestAnswer, RawPosttestAnswer } from '@/types/assessment';

// API base URL - should be configured in environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Types for our state
interface AssessmentState {
  data: {
    questions: Question[];
    activityProgress: ActivityProgress[];
    pretestProgress: RawPretestAnswer[];
    posttestProgress: RawPosttestAnswer[];
    activities: Array<{
      _id: string;
      name: {
        en: string;
        th: string;
      };
      acronym: string;
      location: string;
    }>;
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
    pretestProgress: [],
    posttestProgress: [],
    activities: [],
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
    try {
      // If activityId is "activity", fetch all activity questions
      // Otherwise, fetch questions for specific activity
      const url = activityId === "activity" 
        ? `${API_BASE_URL}/assessments?limit=0`
        : `${API_BASE_URL}/assessments?activity=${activityId}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch activity questions: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching activity questions:', error);
      throw error;
    }
  },

  async createQuestion(activityId: string, questionData: Partial<Question>) {
    try {
      // Validate required fields
      if (!questionData.type || !['text', 'rating', 'dropdown', 'checkbox', 'radio'].includes(questionData.type)) {
        throw new Error('Question type must be one of: text, rating, dropdown, checkbox, radio');
      }
      if (!questionData.question?.en?.trim() || !questionData.question?.th?.trim()) {
        throw new Error('Both English and Thai questions are required and cannot be empty');
      }
      if (typeof questionData.order !== 'number' || questionData.order < 1) {
        throw new Error('Order must be a number and at least 1');
      }
      if (!activityId) {
        throw new Error('Activity ID is required');
      }

      const response = await fetch(`${API_BASE_URL}/assessments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...questionData,
          activity: activityId,
          assessmentType: 'activity',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to create activity question: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating activity question:', error);
      throw error;
    }
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
    try {
      const response = await fetch(`${API_BASE_URL}/assessments/${questionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete activity question: ${response.statusText}`);
      }

      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('Error deleting activity question:', error);
      throw error;
    }
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

  async fetchActivities() {
    const response = await fetch(`${API_BASE_URL}/activities`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch activities: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  },

  async fetchPretestProgress() {
    const response = await fetch(`${API_BASE_URL}/pretest-answers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch pretest progress: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  },

  async fetchPosttestProgress() {
    const response = await fetch(`${API_BASE_URL}/posttest-answers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch posttest progress: ${response.statusText}`);
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

  // Activity operations
  const fetchActivities = useCallback(() => 
    handleFetch(() => assessmentService.fetchActivities(), 'activities'), 
    [handleFetch]
  );

  // Pretest and Posttest progress operations
  const fetchPretestProgress = useCallback(() => 
    handleFetch(() => assessmentService.fetchPretestProgress(), 'pretestProgress'), 
    [handleFetch]
  );

  const fetchPosttestProgress = useCallback(() => 
    handleFetch(() => assessmentService.fetchPosttestProgress(), 'posttestProgress'), 
    [handleFetch]
  );

  // Fetch all progress data when component mounts
  useEffect(() => {
    fetchPretestProgress();
    fetchPosttestProgress();
  }, [fetchPretestProgress, fetchPosttestProgress]);

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
    fetchPretestProgress,
    fetchPosttestProgress,

    // Activity operations
    fetchActivities,
  };
} 