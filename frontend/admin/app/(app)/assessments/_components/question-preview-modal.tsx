"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
  Image,
  Divider,
} from "@heroui/react";
import { Question } from "@/types/assessment";
import { X } from "lucide-react";

interface QuestionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question | null;
}

type ChipColor = "primary" | "secondary" | "success" | "warning" | "danger" | "default";

const QUESTION_TYPE_COLORS: Record<string, ChipColor> = {
  text: "primary",
  rating: "success",
  dropdown: "warning",
  checkbox: "danger",
  radio: "secondary",
};

export default function QuestionPreviewModal({
  isOpen,
  onClose,
  question,
}: QuestionPreviewModalProps) {
  if (!question) {
    return null;
  }

  const { type, order, banner, question: questionText, createdAt, updatedAt, assessmentType } = question;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Question Preview</h2>
          <Button
            isIconOnly
            variant="light"
            onPress={onClose}
            className="absolute right-4 top-4"
          >
            <X size={20} />
          </Button>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            {/* Question Type */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Question Type
              </label>
              <Chip
                size="sm"
                color={QUESTION_TYPE_COLORS[type]}
                variant="flat"
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Chip>
            </div>

            {/* Question Order */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Order
              </label>
              <p className="text-sm">{order}</p>
            </div>

            <Divider />

            {/* Banner Image */}
            {banner && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Banner Image
                </label>
                <div className="relative w-full max-w-md">
                  <Image
                    src={banner}
                    alt="Question banner"
                    className="rounded-lg"
                    width={400}
                    height={200}
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              </div>
            )}

            {/* Question Text (EN) */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Question Text (English)
              </label>
              <div className="p-4 bg-default-50 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{questionText.en}</p>
              </div>
            </div>

            {/* Question Text (TH) */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Question Text (Thai)
              </label>
              <div className="p-4 bg-default-50 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{questionText.th}</p>
              </div>
            </div>

            {/* Additional Info */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Additional Information
              </label>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Created:</span>{" "}
                  {new Date(createdAt).toLocaleString()}
                </p>
                {updatedAt && (
                  <p className="text-sm">
                    <span className="font-medium">Last Updated:</span>{" "}
                    {new Date(updatedAt).toLocaleString()}
                  </p>
                )}
                <p className="text-sm">
                  <span className="font-medium">Assessment Type:</span>{" "}
                  {assessmentType ? 
                    assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1) : 
                    'N/A'}
                </p>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" variant="light" onPress={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 