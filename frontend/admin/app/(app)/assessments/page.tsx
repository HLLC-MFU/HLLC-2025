"use client";

import { useState, useEffect } from "react";
import { Accordion, AccordionItem, Button, addToast } from "@heroui/react";
import { BookOpenCheck, FileQuestion, Activity, Plus, ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import QuestionTable from "./_components/question-table";
import QuestionModal from "./_components/question-modal";
import ActivityDashboard from "./_components/activity-dashboard";
import AssessmentOverviewDashboard from "./_components/assessment-overview-dashboard";
import { Question, AssessmentType } from "@/types/assessment";
import { useAssessment } from "@/hooks/useAssessment";
import { usePostTest } from "@/hooks/usePostTest";
import { usePreTest } from "@/hooks/usePreTest";
import QuestionPreviewModal from "./_components/question-preview-modal";

export default function AssessmentsPage() {
    const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [selectedType, setSelectedType] = useState<AssessmentType>("pretest");

    // Use usePreTest for pretest
    const {
        questions: pretestQuestions,
        loading: pretestLoading,
        error: pretestError,
        createQuestion: createPretestQuestion,
        updateQuestion: updatePretestQuestion,
        deleteQuestion: deletePretestQuestion,
        fetchQuestions: fetchPretestQuestions,
        answers: pretestAnswers,
        fetchAnswers: fetchPretestAnswers,
    } = usePreTest();

    // Use useAssessment only for activity
    const {
        questions: activityQuestions,
        loading: activityLoading,
        error: activityError,
        createQuestion: createActivityQuestion,
        updateQuestion: updateActivityQuestion,
        deleteQuestion: deleteActivityQuestion,
        fetchQuestions: fetchActivityQuestions,
    } = useAssessment();

    // Use usePostTest for posttest
    const {
        questions: posttestQuestions,
        loading: posttestLoading,
        error: posttestError,
        createQuestion: createPosttestQuestion,
        updateQuestion: updatePosttestQuestion,
        deleteQuestion: deletePosttestQuestion,
        fetchQuestions: fetchPosttestQuestions,
        answers: posttestAnswers,
        fetchAnswers: fetchPosttestAnswers,
    } = usePostTest();

    // Fetch questions and answers when component mounts
    useEffect(() => {
        fetchPretestQuestions();
        fetchPosttestQuestions();
        fetchPretestAnswers();
        fetchPosttestAnswers();
        // fetchActivityQuestions("activity");
    }, []);

    const handleAddQuestion = async (questionData: Partial<Question>) => {
        try {
            // Log the current state for debugging
            console.log('Current state:', {
                selectedType,
                selectedQuestion,
                isPosttestQuestion: selectedQuestion ? posttestQuestions.some(q => q._id === selectedQuestion._id) : false,
                isPretestQuestion: selectedQuestion ? pretestQuestions.some(q => q._id === selectedQuestion._id) : false,
                isActivityQuestion: selectedQuestion ? activityQuestions.some(q => q._id === selectedQuestion._id) : false
            });

            if (selectedQuestion) {
                // Check which type of question we're dealing with
                const isPosttestQuestion = posttestQuestions.some(q => q._id === selectedQuestion._id);
                const isPretestQuestion = pretestQuestions.some(q => q._id === selectedQuestion._id);
                const isActivityQuestion = activityQuestions.some(q => q._id === selectedQuestion._id);

                if (isPosttestQuestion || selectedType === "posttest") {
                    await updatePosttestQuestion(selectedQuestion._id, questionData);
                } else if (isPretestQuestion || selectedType === "pretest") {
                    await updatePretestQuestion(selectedQuestion._id, questionData);
                } else if (isActivityQuestion || selectedType === "activity") {
                    await updateActivityQuestion(selectedQuestion._id, {
                        ...questionData,
                        assessmentType: "activity",
                    });
                }
            } else {
                if (selectedType === "posttest") {
                    await createPosttestQuestion(questionData);
                } else if (selectedType === "pretest") {
                    await createPretestQuestion(questionData);
                } else if (selectedType === "activity") {
                    await createActivityQuestion("activity", {
                        ...questionData,
                        assessmentType: "activity",
                    });
                }
            }
            setIsAddQuestionOpen(false);
            setSelectedQuestion(null);
            // Refresh questions for the current type
            if (selectedType === "posttest") {
                await fetchPosttestQuestions();
            } else if (selectedType === "pretest") {
                await fetchPretestQuestions();
            } else if (selectedType === "activity") {
                await fetchActivityQuestions("activity");
            }
        } catch (err) {
            console.error("Failed to save question:", err);
            // Show error toast with more details
            addToast({
                title: err instanceof Error ? err.message : "Failed to save question",
                description: `Type: ${selectedType}, Action: ${selectedQuestion ? 'Update' : 'Create'}`,
                color: "danger",
            });
        }
    };

    const handleEditQuestion = (question: Question) => {
        setSelectedQuestion(question);
        // Check which type of question we're dealing with
        const isPosttestQuestion = posttestQuestions.some(q => q._id === question._id);
        const isPretestQuestion = pretestQuestions.some(q => q._id === question._id);
        const isActivityQuestion = activityQuestions.some(q => q._id === question._id);

        if (isPosttestQuestion) {
            setSelectedType("posttest");
        } else if (isPretestQuestion) {
            setSelectedType("pretest");
        } else if (isActivityQuestion) {
            setSelectedType("activity");
        } else {
            setSelectedType(question.assessmentType || "pretest");
        }
        setIsAddQuestionOpen(true);
    };

    const handleDeleteQuestion = async (questionId: string) => {
        try {
            // Check which type of question we're dealing with
            const isPosttestQuestion = posttestQuestions.some(q => q._id === questionId);
            const isPretestQuestion = pretestQuestions.some(q => q._id === questionId);
            const isActivityQuestion = activityQuestions.some(q => q._id === questionId);

            if (isPosttestQuestion || selectedType === "posttest") {
                await deletePosttestQuestion(questionId);
                await fetchPosttestQuestions();
            } else if (isPretestQuestion || selectedType === "pretest") {
                await deletePretestQuestion(questionId);
                await fetchPretestQuestions();
            } else if (isActivityQuestion || selectedType === "activity") {
                await deleteActivityQuestion(questionId);
                await fetchActivityQuestions("activity");
            }
        } catch (err) {
            console.error("Failed to delete question:", err);
            // Show error toast
            addToast({
                title: err instanceof Error ? err.message : "Failed to delete question",
                color: "danger",
            });
        }
    };

    const handleViewQuestion = (question: Question) => {
        setSelectedQuestion(question);
        setIsPreviewOpen(true);
    };

    const handleAddNewQuestion = (type: AssessmentType) => {
        setSelectedType(type);
        setSelectedQuestion(null);
        setIsAddQuestionOpen(true);
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

    const getQuestionsForType = (type: AssessmentType): Question[] => {
        switch (type) {
            case "pretest":
                return pretestQuestions;
            case "posttest":
                return posttestQuestions;
            case "activity":
                return activityQuestions.filter(q => q.assessmentType === "activity");
            default:
                return [];
        }
    };

    return (
        <>
            <PageHeader
                description='Manage and monitor student assessments — create, review, and track assessment results and progress.'
                icon={<BookOpenCheck />}
            />
            <div className="flex flex-col">
                <div className="flex flex-col gap-6">
                    <Accordion variant="splitted" className="px-0">
                        {/* Pretest Dashboard */}
                        <AccordionItem
                            key="pretest"
                            aria-label="Pretest Result"
                            startContent={sectionIcons.pretest}
                            title="Pretest Result"
                            className="font-medium mb-2"
                        >
                            <AssessmentOverviewDashboard 
                                type="pretest" 
                                answers={pretestAnswers}
                                loading={pretestLoading}
                            />
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
                                questions={pretestQuestions}
                                type="pretest"
                                onEdit={handleEditQuestion}
                                onDelete={handleDeleteQuestion}
                                onView={handleViewQuestion}
                                onAdd={() => handleAddNewQuestion("pretest")}
                            />
                        </AccordionItem>

                        {/* Posttest Dashboard */}
                        <AccordionItem
                            key="posttest"
                            aria-label="Posttest Result"
                            startContent={sectionIcons.posttest}
                            title="Posttest Result"
                            className="font-medium mb-2"
                        >
                            <AssessmentOverviewDashboard 
                                type="posttest" 
                                answers={posttestAnswers}
                                loading={posttestLoading}
                            />
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
                                questions={posttestQuestions}
                                type="posttest"
                                onEdit={handleEditQuestion}
                                onDelete={handleDeleteQuestion}
                                onView={handleViewQuestion}
                                onAdd={() => handleAddNewQuestion("posttest")}
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
                                questions={activityQuestions.filter(q => q.assessmentType === "activity")}
                                type="activity"
                                onEdit={handleEditQuestion}
                                onDelete={handleDeleteQuestion}
                                onView={handleViewQuestion}
                                onAdd={() => handleAddNewQuestion("activity")}
                            />
                        </AccordionItem>
                    </Accordion>
                </div>

                <QuestionModal
                    isOpen={isAddQuestionOpen}
                    onClose={() => {
                        setIsAddQuestionOpen(false);
                        setSelectedQuestion(null);
                    }}
                    onSubmit={handleAddQuestion}
                    question={selectedQuestion}
                    type={selectedType}
                    questions={getQuestionsForType(selectedType)}
                />
                <QuestionPreviewModal
                    isOpen={isPreviewOpen}
                    onClose={() => {
                        setIsPreviewOpen(false);
                        setSelectedQuestion(null);
                    }}
                    question={selectedQuestion}
                />
            </div>
        </>
    );
}