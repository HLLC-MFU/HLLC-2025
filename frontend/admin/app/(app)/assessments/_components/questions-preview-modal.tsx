import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Card, CardBody, CardHeader, Chip, ScrollShadow, Tabs, Tab, Radio, RadioGroup, Checkbox, CheckboxGroup, Input, Textarea } from "@heroui/react";
import { Question, QuestionType } from "@/types/assessment";
import { QUESTION_TYPES, DISPLAY_TYPES, QUESTION_TYPE_COLORS } from "../_constants/question-types";
import { FileQuestion, Activity } from "lucide-react";

interface QuestionsPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  activities: Array<{
    _id: string;
    name: {
      en: string;
      th: string;
    };
  }>;
  type?: "test" | "activity";
}

type QuestionGroup = {
  type: "test" | "activity";
  title: string;
  questions: Question[];
};

type QuestionOption = {
  en: string;
  th: string;
};

// Extended Question type for preview
type QuestionWithOptions = Question & {
  options?: QuestionOption[];
};

// Add new component for question preview
function QuestionPreview({ question }: { question: QuestionWithOptions }) {
  const renderQuestionInput = () => {
    switch (question.type as QuestionType) {
      case "radio":
        return (
          <RadioGroup
            isDisabled
            defaultValue="preview"
            className="gap-2"
          >
            {question.options?.map((option, index) => (
              <Radio key={index} value={`option-${index}`}>
                {option.en} / {option.th}
              </Radio>
            ))}
          </RadioGroup>
        );

      case "checkbox":
        return (
          <CheckboxGroup
            isDisabled
            defaultValue={["preview"]}
            className="gap-2"
          >
            {question.options?.map((option, index) => (
              <Checkbox key={index} value={`option-${index}`}>
                {option.en} / {option.th}
              </Checkbox>
            ))}
          </CheckboxGroup>
        );

      case "text":
        return (
          <Textarea
            isDisabled
            placeholder="Type your answer here..."
            className="w-full"
            minRows={3}
          />
        );

      case "rating":
        return (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Button
                key={rating}
                isDisabled
                variant="flat"
                className="min-w-[40px]"
              >
                {rating}
              </Button>
            ))}
          </div>
        );

      case "dropdown":
        return (
          <select
            disabled
            className="w-full p-2 rounded-lg border border-default-200 bg-default-50"
          >
            <option value="">Select an option...</option>
            {question.options?.map((option, index) => (
              <option key={index} value={`option-${index}`}>
                {option.en} / {option.th}
              </option>
            ))}
          </select>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="font-medium">English:</p>
        <p className="text-sm text-default-600">{question.question.en}</p>
      </div>
      <div className="space-y-2">
        <p className="font-medium">Thai:</p>
        <p className="text-sm text-default-600">{question.question.th}</p>
      </div>
      <div className="space-y-2">
        <p className="font-medium">Answer Input:</p>
        <div className="p-4 bg-default-50 rounded-lg border border-default-200">
          {renderQuestionInput()}
        </div>
      </div>
    </div>
  );
}

export default function QuestionsPreviewModal({
  isOpen,
  onClose,
  questions,
  activities,
  type = "test",
}: QuestionsPreviewModalProps) {
  // Cast questions to include options
  const questionsWithOptions = questions as QuestionWithOptions[];

  // Helper function to get activity name safely
  const getActivityName = (question: Question | undefined | null) => {
    if (!question) return "Unassigned Questions";
    
    if (question.activity?.name?.en) {
      return question.activity.name.en;
    }
    
    if (question.activityId) {
      const activity = activities.find(a => a._id === question.activityId);
      if (activity?.name?.en) {
        return activity.name.en;
      }
    }
    
    return "Unassigned Questions";
  };

  // Group questions by type and activity
  const groupedQuestions = questionsWithOptions.reduce<QuestionGroup[]>((groups, question) => {
    if (!question) return groups; // Skip undefined/null questions

    if (type === "activity") {
      const activityName = getActivityName(question);
      const existingGroup = groups.find(g => g.title === activityName);
      
      if (existingGroup) {
        existingGroup.questions.push(question);
      } else {
        groups.push({
          type: "activity",
          title: activityName,
          questions: [question]
        });
      }
    } else {
      const displayType = question.displayType || "both";
      const groupTitle = `${displayType.charAt(0).toUpperCase() + displayType.slice(1)} Questions`;
      const existingGroup = groups.find(g => g.title === groupTitle);
      
      if (existingGroup) {
        existingGroup.questions.push(question);
      } else {
        groups.push({
          type: "test",
          title: groupTitle,
          questions: [question]
        });
      }
    }
    return groups;
  }, []);

  // Sort groups
  groupedQuestions.sort((a, b) => {
    if (type === "activity") {
      return a.title.localeCompare(b.title);
    } else {
      const displayTypeOrder = { both: 0, pretest: 1, posttest: 2 };
      const aOrder = displayTypeOrder[a.title.split(" ")[0].toLowerCase() as keyof typeof displayTypeOrder] ?? 0;
      const bOrder = displayTypeOrder[b.title.split(" ")[0].toLowerCase() as keyof typeof displayTypeOrder] ?? 0;
      return aOrder - bOrder;
    }
  });

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="5xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {type === "activity" ? (
              <Activity className="text-primary" size={24} />
            ) : (
              <FileQuestion className="text-primary" size={24} />
            )}
            <span>{type === "activity" ? "Activity Questions Preview" : "Test Questions Preview"}</span>
          </div>
        </ModalHeader>
        <ModalBody>
          <ScrollShadow className="max-h-[60vh]">
            <div className="space-y-6">
              {groupedQuestions.map((group) => (
                <div key={`${group.type}-${group.title}`} className="space-y-4">
                  <div className="flex items-center gap-2">
                    {group.type === "activity" ? (
                      <Activity className="text-primary" size={20} />
                    ) : (
                      <FileQuestion className="text-primary" size={20} />
                    )}
                    <h3 className="text-lg font-semibold">{group.title}</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {group.questions.map((question) => (
                      <Card key={question._id} className="border border-default-200">
                        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                          <div className="flex items-center gap-2">
                            <Chip
                              size="sm"
                              color={QUESTION_TYPE_COLORS[question.type]}
                              variant="flat"
                            >
                              {question.type.charAt(0).toUpperCase() + question.type.slice(1)}
                            </Chip>
                            {type === "test" && (
                              <Chip
                                size="sm"
                                color={DISPLAY_TYPES.find(t => t.value === question.displayType)?.color || "default"}
                                variant="flat"
                              >
                                {DISPLAY_TYPES.find(t => t.value === question.displayType)?.label || "Both"}
                              </Chip>
                            )}
                          </div>
                          <span className="text-sm text-default-500">Order: {question.order}</span>
                        </CardHeader>
                        <CardBody>
                          <QuestionPreview question={question} />
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollShadow>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onPress={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 