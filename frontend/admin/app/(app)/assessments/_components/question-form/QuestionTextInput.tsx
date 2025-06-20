"use client";

import { Textarea } from "@heroui/react";

interface QuestionTextInputProps {
  value: string;
  onChange: (value: string) => void;
  language: "en" | "th";
  error?: string;
}

export default function QuestionTextInput({ value, onChange, language, error }: QuestionTextInputProps) {
  const label = language === "en" ? "Question Text (English)" : "Question Text (Thai)";
  const placeholder = language === "en" 
    ? "Enter your question in English..." 
    : "Enter your question in Thai...";

  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        {label}
      </label>
      <Textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        minRows={3}
        isInvalid={!!error}
        errorMessage={error}
      />
    </div>
  );
} 