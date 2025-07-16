import { Question, AssessmentType } from "@/types/assessment";
import { addToast } from "@heroui/react";
import { ModalState } from "../_types/modal";

interface QuestionHandlersProps {
  state: ModalState;
  closeModal: (modalType: keyof ModalState) => void;
  createTestQuestion: (data: Partial<Question>) => Promise<void>;
  updateTestQuestion: (id: string, data: Partial<Question>) => Promise<void>;
  createActivityQuestion: (activityId: string, data: Partial<Question>) => Promise<void>;
  updateActivityQuestion: (id: string, data: Partial<Question>) => Promise<void>;
  deleteTestQuestion: (id: string) => Promise<void>;
  deleteActivityQuestion: (id: string) => Promise<void>;
  fetchTestQuestions: () => Promise<void>;
  fetchActivityQuestions: (activityId: string) => Promise<void>;
}

export const createQuestionHandlers = ({
  state,
  closeModal,
  createTestQuestion,
  updateTestQuestion,
  createActivityQuestion,
  updateActivityQuestion,
  deleteTestQuestion,
  deleteActivityQuestion,
  fetchTestQuestions,
  fetchActivityQuestions,
}: QuestionHandlersProps) => ({
  handleAddTestQuestion: async (questionData: Partial<Question>) => {
    try {
      const isEdit = !!state.test.question;
      if (isEdit) {
        await updateTestQuestion(state.test.question!._id, {
          ...questionData,
          assessmentType: state.test.type,
        });
      } else {
        await createTestQuestion({
          ...questionData,
          assessmentType: state.test.type,
        });
      }
      
      await fetchTestQuestions();
      addToast({
        title: "Success",
        description: `Test question ${isEdit ? 'updated' : 'created'} successfully`,
        color: "success",
      });
      closeModal('test');
    } catch (err) {
      console.error("Failed to save test question:", err);
      addToast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save test question",
        color: "danger",
      });
    }
  },

  handleAddActivityQuestion: async (questionData: Partial<Question>) => {
    try {
      if (!state.selectedActivityId) {
        addToast({
          title: "Activity Required",
          description: "Please select an activity from the dropdown menu before creating a question.",
          color: "warning",
        });
        return;
      }

      const isEdit = !!state.activity.question;
      if (isEdit) {
        await updateActivityQuestion(state.activity.question!._id, {
          ...questionData,
          assessmentType: "activity",
          activityId: state.selectedActivityId,
        });
      } else {
        await createActivityQuestion(state.selectedActivityId, {
          ...questionData,
          assessmentType: "activity",
          activityId: state.selectedActivityId,
        });
      }

      await fetchActivityQuestions(state.selectedActivityId || "activity");
      addToast({
        title: "Success",
        description: `Activity question ${isEdit ? 'updated' : 'created'} successfully`,
        color: "success",
      });
      closeModal('activity');
    } catch (err) {
      console.error("Failed to save activity question:", err);
      addToast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save activity question",
        color: "danger",
      });
    }
  },

  handleDeleteQuestion: async (questionId: string, testQuestions: Question[], activityQuestions: Question[]) => {
    try {
      const question = [...testQuestions, ...activityQuestions].find(q => q._id === questionId);
      if (!question) throw new Error("Question not found");

      const isActivityQuestion = question.assessmentType === "activity" || question.activity || question.activityId;
      
      if (isActivityQuestion) {
        await deleteActivityQuestion(questionId);
        await fetchActivityQuestions(state.selectedActivityId || "activity");
      } else {
        await deleteTestQuestion(questionId);
        await fetchTestQuestions();
      }

      addToast({
        title: "Success",
        description: "Question deleted successfully",
        color: "success",
      });
    } catch (err) {
      console.error("Failed to delete question:", err);
      addToast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete question",
        color: "danger",
      });
    }
  }
}); 