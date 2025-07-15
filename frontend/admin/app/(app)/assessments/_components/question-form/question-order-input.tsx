"use client";

import { Input } from "@heroui/react";

interface QuestionOrderInputProps {
  value: number;
  onChange: (value: number) => void;
  error?: string;
}

export default function QuestionOrderInput({ value, onChange, error }: QuestionOrderInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        Order
      </label>
      <Input
        type="number"
        min={1}
        value={value.toString()}
        onChange={(e) => onChange(parseInt(e.target.value) || 1)}
        isInvalid={!!error}
        errorMessage={error}
      />
    </div>
  );
} 