import { QuestionType, DisplayType } from "@/types/assessment";

type ChipColor = "primary" | "secondary" | "success" | "warning" | "danger" | "default";

export const QUESTION_TYPES: { value: QuestionType; label: string; color: ChipColor }[] = [
  { value: "text", label: "Text", color: "primary" },
  { value: "rating", label: "Rating", color: "success" },
  { value: "dropdown", label: "Dropdown", color: "warning" },
  { value: "checkbox", label: "Checkbox", color: "danger" },
  { value: "radio", label: "Radio", color: "secondary" },
];

export const DISPLAY_TYPES: { value: DisplayType; label: string; color: ChipColor }[] = [
  { value: "both", label: "Both Pretest & Posttest", color: "primary" },
  { value: "pretest", label: "Pretest Only", color: "success" },
  { value: "posttest", label: "Posttest Only", color: "warning" },
];

export const QUESTION_TYPE_COLORS: Record<string, ChipColor> = {
  text: "primary",
  rating: "success",
  dropdown: "warning",
  checkbox: "danger",
  radio: "secondary",
}; 