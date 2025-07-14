import { Question, AssessmentType } from "@/types/assessment";

// Define action types
export type ActionType = 
  | { type: 'OPEN_TEST_MODAL'; payload: { question: Question | null; type: AssessmentType } }
  | { type: 'OPEN_ACTIVITY_MODAL'; payload: { question: Question | null } }
  | { type: 'OPEN_PREVIEW_MODAL'; payload: { question: Question } }
  | { type: 'OPEN_PREVIEW_ALL_MODAL'; payload: { type: 'test' | 'activity' } }
  | { type: 'CLOSE_MODAL'; payload: { modalType: keyof ModalState } }
  | { type: 'SET_SELECTED_ACTIVITY'; payload: { activityId: string } };

// Define state interface
export interface ModalState {
  test: {
    isOpen: boolean;
    question: Question | null;
    type: AssessmentType;
  };
  activity: {
    isOpen: boolean;
    question: Question | null;
  };
  preview: {
    isOpen: boolean;
    question: Question | null;
  };
  previewAll: {
    isOpen: boolean;
    type: 'test' | 'activity' | null;
  };
  selectedActivityId: string;
}

// Initial state
export const initialState: ModalState = {
  test: {
    isOpen: false,
    question: null,
    type: "pretest"
  },
  activity: {
    isOpen: false,
    question: null
  },
  preview: {
    isOpen: false,
    question: null
  },
  previewAll: {
    isOpen: false,
    type: null
  },
  selectedActivityId: ""
};

// Reducer function
export function reducer(state: ModalState, action: ActionType): ModalState {
  switch (action.type) {
    case 'OPEN_TEST_MODAL':
      return {
        ...state,
        test: {
          isOpen: true,
          question: action.payload.question,
          type: action.payload.type
        }
      };
    case 'OPEN_ACTIVITY_MODAL':
      return {
        ...state,
        activity: {
          isOpen: true,
          question: action.payload.question
        }
      };
    case 'OPEN_PREVIEW_MODAL':
      return {
        ...state,
        preview: {
          isOpen: true,
          question: action.payload.question
        }
      };
    case 'OPEN_PREVIEW_ALL_MODAL':
      return {
        ...state,
        previewAll: {
          isOpen: true,
          type: action.payload.type
        }
      };
    case 'CLOSE_MODAL': {
      const modalType = action.payload.modalType;
      if (modalType === 'test') {
        return {
          ...state,
          test: { ...state.test, isOpen: false, question: null }
        };
      }
      if (modalType === 'activity') {
        return {
          ...state,
          activity: { ...state.activity, isOpen: false, question: null }
        };
      }
      if (modalType === 'preview') {
        return {
          ...state,
          preview: { ...state.preview, isOpen: false, question: null }
        };
      }
      if (modalType === 'previewAll') {
        return {
          ...state,
          previewAll: { isOpen: false, type: null }
        };
      }
      return state;
    }
    case 'SET_SELECTED_ACTIVITY':
      return {
        ...state,
        selectedActivityId: action.payload.activityId
      };
    default:
      return state;
  }
} 