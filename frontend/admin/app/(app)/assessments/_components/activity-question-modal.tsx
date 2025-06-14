"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Divider,
  addToast,
} from "@heroui/react";
import { Question } from "@/types/assessment";
import QuestionTypeSelect from "./question-form/question-type-select";
import QuestionTextInput from "./question-form/question-text-input";
import QuestionOrderInput from "./question-form/question-order-input";

interface ActivityQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (questionData: Partial<Question>) => void;
  question: Question | null;
  questions: Question[];
}

export default function ActivityQuestionModal({
  isOpen,
  onClose,
  onSubmit,
  question,
  questions,
}: ActivityQuestionModalProps) {
  const [formData, setFormData] = useState<Partial<Question>>({
    type: "text",
    question: {
      en: "",
      th: "",
    },
    order: 1,
    assessmentType: "activity",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (question) {
      setFormData({
        type: question.type,
        question: question.question,
        order: question.order,
        assessmentType: "activity",
        activityId: question.activityId,
      });
    } else {
      setFormData({
        type: "text",
        question: {
          en: "",
          th: "",
        },
        order: 1,
        assessmentType: "activity",
      });
    }
    setErrors({});
  }, [question]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.question?.en?.trim()) {
      newErrors.questionEn = "English question is required";
    }

    if (!formData.question?.th?.trim()) {
      newErrors.questionTh = "Thai question is required";
    }

    if (formData.order === undefined || formData.order < 1) {
      newErrors.order = "Order must be at least 1";
    } else {
      const isOrderExists = questions.some(q => {
        if (question && q._id === question._id) {
          return false;
        }
        return q.order === formData.order;
      });

      if (isOrderExists) {
        newErrors.order = "This order number is already in use. Please choose a different number.";
      }
    }

    if (!formData.type) {
      newErrors.type = "Question type is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    try {
      if (!validateForm()) {
        addToast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          color: "danger",
        });
        return;
      }

      await onSubmit(formData);
      onClose();
    } catch (err) {
      console.error("Failed to submit question:", err);
      addToast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to submit question",
        color: "danger",
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader>
          <h2 className="text-xl font-semibold">
            {question ? "Edit Activity Question" : "Add New Activity Question"}
          </h2>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            {/* Question Type */}
            <QuestionTypeSelect
              value={formData.type || "text"}
              onChange={(type) => setFormData(prev => ({ ...prev, type }))}
              error={errors.type}
            />

            {/* Question Order */}
            <QuestionOrderInput
              value={formData.order || 1}
              onChange={(order) => setFormData(prev => ({ ...prev, order }))}
              error={errors.order}
            />

            <Divider />

            {/* Question Text (EN) */}
            <QuestionTextInput
              value={formData.question?.en || ""}
              onChange={(en) => setFormData(prev => ({
                ...prev,
                question: { ...prev.question!, en }
              }))}
              language="en"
              error={errors.questionEn}
            />

            {/* Question Text (TH) */}
            <QuestionTextInput
              value={formData.question?.th || ""}
              onChange={(th) => setFormData(prev => ({
                ...prev,
                question: { ...prev.question!, th }
              }))}
              language="th"
              error={errors.questionTh}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button color="primary" onPress={handleSubmit}>
            {question ? "Update" : "Add"} Question
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 