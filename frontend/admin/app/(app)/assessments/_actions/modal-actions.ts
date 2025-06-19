import { Dispatch } from "react";
import { Question, AssessmentType } from "@/types/assessment";
import { ActionType, ModalState } from "../_types/modal";

export const createModalActions = (dispatch: Dispatch<ActionType>) => ({
  openTestModal: (question: Question | null = null, type: AssessmentType = "pretest") => {
    dispatch({ type: 'OPEN_TEST_MODAL', payload: { question, type } });
  },

  openActivityModal: (question: Question | null = null) => {
    dispatch({ type: 'OPEN_ACTIVITY_MODAL', payload: { question } });
  },

  openPreviewModal: (question: Question) => {
    dispatch({ type: 'OPEN_PREVIEW_MODAL', payload: { question } });
  },

  openPreviewAllModal: (type: 'test' | 'activity') => {
    dispatch({ type: 'OPEN_PREVIEW_ALL_MODAL', payload: { type } });
  },

  closeModal: (modalType: keyof ModalState) => {
    dispatch({ type: 'CLOSE_MODAL', payload: { modalType } });
  },

  setSelectedActivity: (activityId: string) => {
    dispatch({ type: 'SET_SELECTED_ACTIVITY', payload: { activityId } });
  }
}); 