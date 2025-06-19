"use client";

import { useReducer, useEffect, useMemo } from "react";
import { Accordion, AccordionItem, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { BookOpenCheck, ClipboardList, Eye } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import QuestionTable from "./_components/question-table";
import ActivityQuestionTable from "./_components/activity-question-table";
import QuestionPreviewModal from "./_components/question-preview-modal";
import ActivityQuestionModal from "./_components/activity-question-modal";
import QuestionModal from "./_components/question-modal";
import QuestionsPreviewModal from "./_components/questions-preview-modal";
import { useAssessment } from "@/hooks/useAssessment";
import { usePrepostQuestions } from "@/hooks/usePrepostQuestions";
import { initialState, reducer } from "./_types/modal";
import { createModalActions } from "./_actions/modal-actions";
import { createQuestionHandlers } from "./_actions/question-handlers";
import { AssessmentType } from "@/types/assessment";

export default function AssessmentsPage() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { test, activity, preview, previewAll, selectedActivityId } = state;

    const {
        questions: testQuestions,
        loading: testLoading,
        createQuestion: createTestQuestion,
        updateQuestion: updateTestQuestion,
        deleteQuestion: deleteTestQuestion,
        fetchQuestions: fetchTestQuestions,
        answers: testAnswers,
        fetchAnswers: fetchTestAnswers,
    } = usePrepostQuestions(test.type);

    const {
        questions: activityQuestions,
        loading: activityLoading,
        createQuestion: createActivityQuestion,
        updateQuestion: updateActivityQuestion,
        deleteQuestion: deleteActivityQuestion,
        fetchQuestions: fetchActivityQuestions,
        activities,
        loading: activitiesLoading,
        fetchActivities,
    } = useAssessment();

    // Create actions and handlers
    const actions = createModalActions(dispatch);
    const handlers = createQuestionHandlers({
        state,
        closeModal: actions.closeModal,
        createTestQuestion,
        updateTestQuestion,
        createActivityQuestion,
        updateActivityQuestion,
        deleteTestQuestion,
        deleteActivityQuestion,
        fetchTestQuestions,
        fetchActivityQuestions,
    });

    // Fetch initial data
    useEffect(() => {
        fetchTestQuestions();
        fetchTestAnswers();
        fetchActivities();
    }, [test.type]);

    useEffect(() => {
        fetchActivityQuestions(selectedActivityId || "activity");
    }, [selectedActivityId]);

    // Filtered activity questions
    const filteredActivityQuestions = useMemo(() => activityQuestions, [activityQuestions]);

    // Icon mapping
    const sectionIcons = {
        testQuestions: <ClipboardList />,
        activityQuestions: <ClipboardList />,
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
                        {/* Test Questions Management */}
                        <AccordionItem
                            key="testQuestions"
                            aria-label="Test Questions Management"
                            startContent={sectionIcons.testQuestions}
                            title="Test Questions Management"
                            className="font-medium mb-2"
                        >
                            <div className="flex justify-end mb-4">
                                <Button
                                    color="primary"
                                    variant="flat"
                                    startContent={<Eye size={20} />}
                                    onPress={() => actions.openPreviewAllModal('test')}
                                >
                                    Preview Test Questions
                                </Button>
                            </div>
                            <QuestionTable
                                questions={testQuestions}
                                type={test.type}
                                onEdit={(q) => actions.openTestModal(q, (q.assessmentType ?? "pretest") as AssessmentType)}
                                onDelete={(id) => handlers.handleDeleteQuestion(id, testQuestions, activityQuestions)}
                                onView={actions.openPreviewModal}
                                onAdd={() => actions.openTestModal()}
                            />
                        </AccordionItem>

                        {/* Activity Questions Management */}
                        <AccordionItem
                            key="activityQuestions"
                            aria-label="Activity Questions Management"
                            startContent={sectionIcons.activityQuestions}
                            title="Activity Questions Management"
                            className="font-medium mb-2"
                        >
                            <div className="flex justify-between mb-4">
                                <Dropdown>
                                    <DropdownTrigger>
                                        <Button 
                                            variant="bordered" 
                                            className="capitalize"
                                            isLoading={activitiesLoading}
                                        >
                                            {selectedActivityId 
                                                ? activities.find(a => a._id === selectedActivityId)?.name.en || "Select Activity"
                                                : "All Activities"}
                                        </Button>
                                    </DropdownTrigger>
                                    <DropdownMenu 
                                        aria-label="Activity Selection"
                                        onAction={(key) => actions.setSelectedActivity(key as string)}
                                        items={[
                                            { key: "", label: "All Activities" },
                                            ...(activities?.map(activity => ({
                                                key: activity._id,
                                                label: activity.name.en
                                            })) || [])
                                        ]}
                                    >
                                        {(item) => (
                                            <DropdownItem key={item.key} textValue={item.label}>
                                                {item.label}
                                            </DropdownItem>
                                        )}
                                    </DropdownMenu>
                                </Dropdown>
                                <Button
                                    color="primary"
                                    variant="flat"
                                    startContent={<Eye size={20} />}
                                    onPress={() => actions.openPreviewAllModal('activity')}
                                >
                                    Preview Activity Questions
                                </Button>
                            </div>
                            <ActivityQuestionTable
                                questions={filteredActivityQuestions}
                                activities={activities}
                                onEdit={actions.openActivityModal}
                                onDelete={(id) => handlers.handleDeleteQuestion(id, testQuestions, activityQuestions)}
                                onView={actions.openPreviewModal}
                                onAdd={() => actions.openActivityModal()}
                            />
                        </AccordionItem>
                    </Accordion>
                </div>

                {/* Modals */}
                <QuestionModal
                    isOpen={test.isOpen}
                    onClose={() => actions.closeModal('test')}
                    onSubmit={handlers.handleAddTestQuestion}
                    question={test.question}
                    type={(test.question?.assessmentType ?? test.type) as AssessmentType}
                    questions={testQuestions}
                />

                <ActivityQuestionModal
                    isOpen={activity.isOpen}
                    onClose={() => actions.closeModal('activity')}
                    onSubmit={handlers.handleAddActivityQuestion}
                    question={activity.question}
                    questions={filteredActivityQuestions}
                />

                <QuestionPreviewModal
                    isOpen={preview.isOpen}
                    onClose={() => actions.closeModal('preview')}
                    question={preview.question}
                />

                <QuestionsPreviewModal
                    isOpen={previewAll.isOpen && previewAll.type === 'test'}
                    onClose={() => actions.closeModal('previewAll')}
                    questions={testQuestions}
                    activities={activities}
                    type="test"
                />

                <QuestionsPreviewModal
                    isOpen={previewAll.isOpen && previewAll.type === 'activity'}
                    onClose={() => actions.closeModal('previewAll')}
                    questions={activityQuestions}
                    activities={activities}
                    type="activity"
                />
            </div>
        </>
    );
}