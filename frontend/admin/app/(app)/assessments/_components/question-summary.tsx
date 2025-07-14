import { Card, CardHeader, CardBody, Divider, Chip } from "@heroui/react";
import { FileQuestion } from "lucide-react";
import { Question } from "@/types/assessment";
import { QUESTION_TYPE_COLORS } from "./utils/assessment-utils";

interface QuestionSummaryProps {
    questions: Array<Question & {
        averageScore: number;
        totalAnswers: number;
    }>;
}

export function QuestionSummary({ questions }: QuestionSummaryProps) {
    if (questions.length === 0) return null;

    return (
        <Card>
            <CardHeader className="flex items-center gap-2 pb-2">
                <FileQuestion className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Question Summary</h3>
            </CardHeader>
            <Divider />
            <CardBody>
                <div className="space-y-4">
                    {questions.map((question) => (
                        <Card key={question._id} className="border border-default-200">
                            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                                <div className="flex items-center gap-2">
                                    <Chip
                                        size="sm"
                                        color={QUESTION_TYPE_COLORS[question.type] || "default"}
                                        variant="flat"
                                    >
                                        {question.type.charAt(0).toUpperCase() + question.type.slice(1)}
                                    </Chip>
                                    <span className="text-sm text-default-500">Order: {question.order}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-default-500">
                                        Total Answers: {question.totalAnswers}
                                    </span>
                                    {(question.type === 'rating' || question.type === 'radio' || question.type === 'checkbox') && (
                                        <span className="text-sm font-medium">
                                            Average: {question.averageScore.toFixed(2)}
                                            {question.type === 'rating' ? '/5' : '%'}
                                        </span>
                                    )}
                                </div>
                            </CardHeader>
                            <CardBody>
                                <div className="space-y-2">
                                    <div className="font-medium text-gray-900">
                                        {question.question?.th}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {question.question?.en}
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            </CardBody>
        </Card>
    );
} 