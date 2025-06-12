"use client";

import { useState, useEffect, useRef } from "react";
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
  Image,
} from "@heroui/react";
import { Question, AssessmentType, QuestionType } from "@/types/assessment";
import { Plus, X, Upload } from "lucide-react";

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (questionData: Partial<Question>) => void;
  question: Question | null;
  type: AssessmentType;
  questions: Question[];
}

type ChipColor = "primary" | "secondary" | "success" | "warning" | "danger" | "default";

const QUESTION_TYPES: { value: QuestionType; label: string; color: ChipColor }[] = [
  { value: "text", label: "Text", color: "primary" },
  { value: "rating", label: "Rating", color: "success" },
  { value: "dropdown", label: "Dropdown", color: "warning" },
  { value: "checkbox", label: "Checkbox", color: "danger" },
  { value: "radio", label: "Radio", color: "secondary" },
];

export default function QuestionModal({
  isOpen,
  onClose,
  onSubmit,
  question,
  type,
  questions,
}: QuestionModalProps) {
  const [formData, setFormData] = useState<Partial<Question>>({
    type: "text",
    question: {
      en: "",
      th: "",
    },
    order: 1,
    banner: null,
    assessmentType: type,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (question) {
      setFormData({
        type: question.type,
        question: question.question,
        order: question.order,
        banner: question.banner,
        assessmentType: question.assessmentType || type,
      });
      // Set preview URL if banner exists
      if (question.banner) {
        setPreviewUrl(question.banner);
      }
    } else {
      setFormData({
        type: "text",
        question: {
          en: "",
          th: "",
        },
        order: 1,
        banner: null,
        assessmentType: type,
      });
      setPreviewUrl(null);
    }
    setErrors({});
  }, [question, type]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, banner: 'Please upload an image file' }));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, banner: 'File size must be less than 5MB' }));
      return;
    }

    try {
      setIsUploading(true);
      // Remove banner error if it exists
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.banner;
        return newErrors;
      });

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Upload file
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      
      // Update form data with the uploaded file URL
      setFormData(prev => ({
        ...prev,
        banner: data.url,
      }));
      setPreviewUrl(data.url);
    } catch (error) {
      console.error('File upload error:', error);
      setErrors(prev => ({ 
        ...prev, 
        banner: 'Failed to upload file. Please try again.' 
      }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveBanner = () => {
    setFormData(prev => ({
      ...prev,
      banner: null,
    }));
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
      // Check if the order number already exists
      const isOrderExists = questions.some(q => {
        // Skip checking against the current question when editing
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

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
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
            {/* Question Type */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Question Type
              </label>
              <Select
                selectedKeys={[formData.type || "text"]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as QuestionType;
                  setFormData((prev) => ({
                    ...prev,
                    type: selected,
                  }));
                }}
                aria-label="Select question type"
                isInvalid={!!errors.type}
                errorMessage={errors.type}
              >
                {QUESTION_TYPES.map((type) => (
                  <SelectItem
                    key={type.value}
                    textValue={type.label}
                    aria-label={type.label}
                  >
                    <div className="flex items-center gap-2">
                      <Chip size="sm" color={type.color} variant="flat">
                        {type.label}
                      </Chip>
                    </div>
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Question Order */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Order
              </label>
              <Input
                type="number"
                min={1}
                value={formData.order?.toString() || "1"}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    order: parseInt(e.target.value) || 1,
                  }))
                }
                isInvalid={!!errors.order}
                errorMessage={errors.order}
              />
            </div>

            <Divider />

            {/* Banner Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Banner Image (Optional)
              </label>
              <div className="space-y-4">
                {previewUrl && (
                  <div className="relative w-full max-w-md">
                    <Image
                      src={previewUrl}
                      alt="Banner preview"
                      className="rounded-lg"
                      width={400}
                      height={200}
                      style={{ objectFit: 'cover' }}
                    />
                    <Button
                      isIconOnly
                      color="danger"
                      variant="flat"
                      className="absolute top-2 right-2"
                      onPress={handleRemoveBanner}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    isDisabled={isUploading}
                    className="flex-1"
                  />
                  {isUploading && (
                    <Chip color="primary" variant="flat">
                      Uploading...
                    </Chip>
                  )}
                </div>
                {errors.banner && (
                  <p className="text-danger text-sm mt-1">{errors.banner}</p>
                )}
                <p className="text-sm text-default-500">
                  Supported formats: JPG, PNG, GIF. Max size: 5MB
                </p>
              </div>
            </div>

            {/* Question Text (EN) */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Question Text (English)
              </label>
              <Textarea
                placeholder="Enter your question in English..."
                value={formData.question?.en || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    question: {
                      ...prev.question!,
                      en: e.target.value,
                    },
                  }))
                }
                minRows={3}
                isInvalid={!!errors.questionEn}
                errorMessage={errors.questionEn}
              />
            </div>

            {/* Question Text (TH) */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Question Text (Thai)
              </label>
              <Textarea
                placeholder="Enter your question in Thai..."
                value={formData.question?.th || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    question: {
                      ...prev.question!,
                      th: e.target.value,
                    },
                  }))
                }
                minRows={3}
                isInvalid={!!errors.questionTh}
                errorMessage={errors.questionTh}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button 
            color="primary" 
            onPress={handleSubmit}
            isDisabled={isUploading}
          >
            {question ? "Save Changes" : "Add Question"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 