"use client";

import { useState } from "react";
import { Accordion, AccordionItem, Button } from "@heroui/react";
import { BookOpenCheck, FileQuestion, Activity, Plus, ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import QuestionTable from "./_components/question-table";
import QuestionModal from "./_components/question-modal";
import ActivityDashboard from "./_components/activity-dashboard";
import AssessmentOverviewDashboard from "./_components/assessment-overview-dashboard";
import { Question, AssessmentType } from "@/types/assessment";
import { useAssessment } from "@/hooks/useAssessment";

export default function AssessmentsPage() {
    const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<Question | undefined>();
    const [selectedType, setSelectedType] = useState<AssessmentType>("pretest");

    const {
        questions,
        loading,
        error,
        createQuestion,
        updateQuestion,
        deleteQuestion,
        fetchQuestions,
    } = useAssessment();

    const handleAddQuestion = async (questionData: Partial<Question>) => {
        try {
            if (selectedQuestion) {
                await updateQuestion(selectedQuestion._id, {
                    ...questionData,
                    assessmentType: selectedType,
                });
            } else {
                await createQuestion({
                    ...questionData,
                    assessmentType: selectedType,
                });
            }
            setIsAddQuestionOpen(false);
            setSelectedQuestion(undefined);
            // Refresh questions for the current type
            fetchQuestions(selectedType);
        } catch (err) {
            console.error("Failed to save question:", err);
        }
    };

    const handleEditQuestion = (question: Question) => {
        setSelectedQuestion(question);
        setSelectedType(question.assessmentType);
        setIsAddQuestionOpen(true);
    };

    const handleDeleteQuestion = async (questionId: string) => {
        try {
            await deleteQuestion(questionId);
            // Refresh questions for the current type
            fetchQuestions(selectedType);
        } catch (err) {
            console.error("Failed to delete question:", err);
        }
    };

    const handleViewQuestion = (question: Question) => {
        // TODO: Implement view question details
        console.log("Viewing question:", question);
    };

    // Icon mapping for different sections
    const sectionIcons: Record<string, React.ReactNode> = {
        pretest: <FileQuestion />,
        posttest: <FileQuestion />,
        activity: <Activity />,
        activityDashboard: <Activity />,
        pretestQuestions: <ClipboardList />,
        posttestQuestions: <ClipboardList />,
        activityQuestions: <ClipboardList />,
    };

    return (
        <>
            <PageHeader
                description='Manage and monitor student assessments — create, review, and track assessment results and progress.'
                icon={<BookOpenCheck />}
                right={
                    <Button
                        color="primary"
                        size="lg"
                        endContent={<Plus size={20} />}
                        onPress={() => {
                            setSelectedQuestion(undefined);
                            setIsAddQuestionOpen(true);
                        }}
                    >
                        Add Question
                    </Button>
                }
            />
            <div className="flex flex-col">
                <div className="flex flex-col gap-6">
                    <Accordion variant="splitted" className="px-0">
                        {/* Pretest Dashboard */}
                        <AccordionItem
                            key="pretest"
                            aria-label="Pretest Assessment"
                            startContent={sectionIcons.pretest}
                            title="Pretest Assessment"
                            className="font-medium mb-2"
                        >
                            <AssessmentOverviewDashboard type="pretest" />
                        </AccordionItem>

                        {/* Pretest Questions Management */}
                        <AccordionItem
                            key="pretestQuestions"
                            aria-label="Pretest Questions Management"
                            startContent={sectionIcons.pretestQuestions}
                            title="Pretest Questions Management"
                            className="font-medium mb-2"
                        >
                            <QuestionTable
                                questions={questions.filter(q => q.assessmentType === "pretest")}
                                type="pretest"
                                onEdit={handleEditQuestion}
                                onDelete={handleDeleteQuestion}
                                onView={handleViewQuestion}
                            />
                        </AccordionItem>

                        {/* Posttest Dashboard */}
                        <AccordionItem
                            key="posttest"
                            aria-label="Posttest Assessment"
                            startContent={sectionIcons.posttest}
                            title="Posttest Assessment"
                            className="font-medium mb-2"
                        >
                            <AssessmentOverviewDashboard type="posttest" />
                        </AccordionItem>

                        {/* Posttest Questions Management */}
                        <AccordionItem
                            key="posttestQuestions"
                            aria-label="Posttest Questions Management"
                            startContent={sectionIcons.posttestQuestions}
                            title="Posttest Questions Management"
                            className="font-medium mb-2"
                        >
                            <QuestionTable
                                questions={questions.filter(q => q.assessmentType === "posttest")}
                                type="posttest"
                                onEdit={handleEditQuestion}
                                onDelete={handleDeleteQuestion}
                                onView={handleViewQuestion}
                            />
                        </AccordionItem>

                        {/* Activity Dashboard */}
                        <AccordionItem
                            key="activityDashboard"
                            aria-label="Activity Dashboard"
                            startContent={sectionIcons.activityDashboard}
                            title="Activity Dashboard"
                            className="font-medium mb-2"
                        >
                            <ActivityDashboard />
                        </AccordionItem>

                        {/* Activity Questions Management */}
                        <AccordionItem
                            key="activityQuestions"
                            aria-label="Activity Questions Management"
                            startContent={sectionIcons.activityQuestions}
                            title="Activity Questions Management"
                            className="font-medium mb-2"
                        >
                            <QuestionTable
                                questions={questions.filter(q => q.assessmentType === "activity")}
                                type="activity"
                                onEdit={handleEditQuestion}
                                onDelete={handleDeleteQuestion}
                                onView={handleViewQuestion}
                            />
                        </AccordionItem>
                    </Accordion>
                </div>

                <QuestionModal
                    isOpen={isAddQuestionOpen}
                    onClose={() => {
                        setIsAddQuestionOpen(false);
                        setSelectedQuestion(undefined);
                    }}
                    onSubmit={handleAddQuestion}
                    question={selectedQuestion}
                    type={selectedType}
                />
            </div>
        </>
    );
}