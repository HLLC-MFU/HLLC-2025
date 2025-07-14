"use client";

import { Select, SelectItem, Chip } from "@heroui/react";
import { DisplayType } from "@/types/assessment";
import { DISPLAY_TYPES } from "../../_constants/question-types";

interface DisplayTypeSelectProps {
  value: DisplayType;
  onChange: (type: DisplayType) => void;
  error?: string;
}

export default function DisplayTypeSelect({ value, onChange, error }: DisplayTypeSelectProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        Display Type
      </label>
      <Select
        selectedKeys={[value]}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as DisplayType;
          onChange(selected);
        }}
        aria-label="Select display type"
        isInvalid={!!error}
        errorMessage={error}
      >
        {DISPLAY_TYPES.map((type) => (
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