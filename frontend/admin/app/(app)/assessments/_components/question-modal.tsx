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
  useDisclosure,
} from "@heroui/react";
import { Question, AssessmentType, QuestionType, DisplayType } from "@/types/assessment";
import QuestionTypeSelect from "./question-form/question-type-select";
import DisplayTypeSelect from "./question-form/display-type-select";
import QuestionTextInput from "./question-form/question-text-input";
import QuestionOrderInput from "./question-form/question-order-input";

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (questionData: Partial<Question>) => void;
  question: Question | null;
  type: AssessmentType;
  questions: Question[];
}

export default function QuestionModal({
  isOpen,
  onClose,
  onSubmit,
  question,
  type,
  questions,
}: QuestionModalProps) {
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();
  const [formData, setFormData] = useState<Partial<Question>>({
    type: "text",
    displayType: "both",
    question: {
      en: "",
      th: "",
    },
    order: 1,
    assessmentType: type,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (question) {
        setFormData({
          type: question.type,
          displayType: question.displayType || "both",
          question: question.question,
          order: question.order,
          assessmentType: type,
        });
      } else {
        setFormData({
          type: "text",
          displayType: "both",
          question: {
            en: "",
            th: "",
          },
          order: 1,
          assessmentType: type,
        });
      }
      setErrors({});
    }
  }, [isOpen, question, type]);

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

    if (!formData.displayType) {
      newErrors.displayType = "Display type is required";
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

      if (type === "activity") {
        // Show confirmation modal for activity questions
        onConfirmOpen();
        return;
      }

      // For non-activity questions, submit directly
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

  const handleConfirmSubmit = async () => {
    try {
      await onSubmit(formData);
      onConfirmClose();
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
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" isDismissable={false} isKeyboardDismissDisabled={true}>
        <ModalContent>
          <ModalHeader>
            <h2 className="text-xl font-semibold">
              {question ? "Edit Question" : "Add New Question"}
            </h2>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              {/* Display Type (for Pretest/Posttest questions) */}
              {type !== "activity" && (
                <DisplayTypeSelect
                  value={formData.displayType || "both"}
                  onChange={(displayType) => setFormData(prev => ({ ...prev, displayType }))}
                  error={errors.displayType}
                />
              )}

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

      {/* Confirmation Modal */}
      <Modal isOpen={isConfirmOpen} onClose={onConfirmClose}>
        <ModalContent>
          <ModalHeader>Confirm Question Creation</ModalHeader>
          <ModalBody>
            <p>Are you sure you want to create this question for the selected activity?</p>
            <p className="text-sm text-default-400 mt-2">
              Note: Make sure you have selected an activity from the dropdown menu above.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onConfirmClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleConfirmSubmit}>
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
} 