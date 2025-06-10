"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Chip,
  Divider,
} from "@heroui/react";
import { Question, AssessmentType, QuestionDifficulty } from "@/types/assessment";
import { Plus, X } from "lucide-react";

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (questionData: Partial<Question>) => void;
  question?: Question;
  type: AssessmentType;
}

export default function QuestionModal({
  isOpen,
  onClose,
  onSubmit,
  question,
  type,
}: QuestionModalProps) {
  const [formData, setFormData] = useState<Partial<Question>>({
    text: "",
    options: [""],
    correctAnswer: 0,
    difficulty: "medium",
    assessmentType: type,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (question) {
      setFormData({
        text: question.text,
        options: question.options || [""],
        correctAnswer: question.correctAnswer,
        difficulty: question.difficulty,
        assessmentType: question.assessmentType,
      });
    } else {
      setFormData({
        text: "",
        options: [""],
        correctAnswer: 0,
        difficulty: "medium",
        assessmentType: type,
      });
    }
    setErrors({});
  }, [question, type]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.text?.trim()) {
      newErrors.text = "Question text is required";
    }

    if (formData.options) {
      const emptyOptions = formData.options.filter(opt => !opt.trim());
      if (emptyOptions.length > 0) {
        newErrors.options = "All options must be filled";
      }
      if (formData.options.length < 2) {
        newErrors.options = "At least 2 options are required";
      }
    }

    if (formData.correctAnswer === undefined || formData.correctAnswer < 0) {
      newErrors.correctAnswer = "Please select a correct answer";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleAddOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...(prev.options || []), ""],
    }));
  };

  const handleRemoveOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index),
      correctAnswer: prev.correctAnswer === index ? 0 : prev.correctAnswer,
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options?.map((opt, i) => (i === index ? value : opt)),
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader>
          <h2 className="text-xl font-semibold">
            {question ? "Edit Question" : "Add New Question"}
          </h2>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            {/* Question Text */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Question Text
              </label>
              <Textarea
                placeholder="Enter your question..."
                value={formData.text}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, text: e.target.value }))
                }
                minRows={3}
                isInvalid={!!errors.text}
                errorMessage={errors.text}
              />
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Difficulty Level
              </label>
              <Select
                selectedKeys={[formData.difficulty || "medium"]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as QuestionDifficulty;
                  setFormData((prev) => ({
                    ...prev,
                    difficulty: selected,
                  }));
                }}
              >
                <SelectItem key="easy">
                  <div className="flex items-center gap-2">
                    <Chip size="sm" color="success" variant="flat">
                      Easy
                    </Chip>
                  </div>
                </SelectItem>
                <SelectItem key="medium">
                  <div className="flex items-center gap-2">
                    <Chip size="sm" color="warning" variant="flat">
                      Medium
                    </Chip>
                  </div>
                </SelectItem>
                <SelectItem key="hard">
                  <div className="flex items-center gap-2">
                    <Chip size="sm" color="danger" variant="flat">
                      Hard
                    </Chip>
                  </div>
                </SelectItem>
              </Select>
            </div>

            <Divider />

            {/* Options */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">
                  Answer Options
                </label>
                <Button
                  size="sm"
                  variant="light"
                  startContent={<Plus size={16} />}
                  onPress={handleAddOption}
                >
                  Add Option
                </Button>
              </div>
              {errors.options && (
                <p className="text-danger text-sm mb-2">{errors.options}</p>
              )}
              <div className="space-y-2">
                {formData.options?.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      startContent={
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={formData.correctAnswer === index}
                            onChange={() =>
                              setFormData((prev) => ({
                                ...prev,
                                correctAnswer: index,
                              }))
                            }
                            className="mr-2"
                          />
                          <span className="text-sm font-medium">
                            {String.fromCharCode(65 + index)}.
                          </span>
                        </div>
                      }
                      endContent={
                        formData.options && formData.options.length > 2 ? (
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => handleRemoveOption(index)}
                          >
                            <X size={16} />
                          </Button>
                        ) : null
                      }
                    />
                  </div>
                ))}
              </div>
              {errors.correctAnswer && (
                <p className="text-danger text-sm mt-2">
                  {errors.correctAnswer}
                </p>
              )}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button color="primary" onPress={handleSubmit}>
            {question ? "Save Changes" : "Add Question"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 