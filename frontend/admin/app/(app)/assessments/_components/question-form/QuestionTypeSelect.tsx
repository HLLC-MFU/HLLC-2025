"use client";

import { Select, SelectItem, Chip } from "@heroui/react";
import { QuestionType } from "@/types/assessment";
import { QUESTION_TYPES } from "../../_constants/question-types";

interface QuestionTypeSelectProps {
  value: QuestionType;
  onChange: (type: QuestionType) => void;
  error?: string;
}

export default function QuestionTypeSelect({ value, onChange, error }: QuestionTypeSelectProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        Question Type
      </label>
      <Select
        selectedKeys={[value]}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as QuestionType;
          onChange(selected);
        }}
        aria-label="Select question type"
        isInvalid={!!error}
        errorMessage={error}
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
  );
} 