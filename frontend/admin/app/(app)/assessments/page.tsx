"use client";

import { useReducer, useEffect, useMemo, useState, useRef } from "react";
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
import Papa from "papaparse";

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

    // เพิ่ม ref สำหรับ file input
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [importType, setImportType] = useState<'test' | 'activity' | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    // ฟังก์ชัน handleImport
    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const fileType = file.name.endsWith('.json') ? 'json' : 'csv';
        const reader = new FileReader();
        reader.onload = async (e) => {
            setIsImporting(true);
            let questions: any[] = [];
            try {
                if (fileType === 'json') {
                    const json = JSON.parse(e.target?.result as string);
                    questions = Array.isArray(json) ? json : [json];
                } else {
                    const csv = Papa.parse(e.target?.result as string, { skipEmptyLines: true });
                    questions = parseQuestionsFromCSV(csv.data as string[][], importType);
                }
                if (importType === 'test') {
                    for (const q of questions) {
                        await createTestQuestion(q);
                    }
                    fetchTestQuestions();
                } else if (importType === 'activity') {
                    if (!selectedActivityId) throw new Error('Please select an activity before importing.');
                    for (const q of questions) {
                        await createActivityQuestion(selectedActivityId, q);
                    }
                    fetchActivityQuestions(selectedActivityId || "activity");
                }
                alert('Import successful!');
            } catch (err) {
                alert('Import failed: ' + (err as Error).message);
            } finally {
                setIsImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    // ฟังก์ชันแปลงข้อมูลจาก CSV เป็น question objects
    function parseQuestionsFromCSV(data: string[][], type: 'test' | 'activity' | null) {
        const questions: any[] = [];
        if (type === 'test') {
            // หา index ของหัวตาราง
            const headerIdx = data.findIndex(row => row.includes('Question Thai'));
            if (headerIdx === -1) return questions;
            for (let i = headerIdx + 1; i < data.length; i++) {
                const row = data[i];
                if (!row[1] || !row[2]) continue;
                questions.push({
                    question: { th: row[1], en: row[2] },
                    status: row[3],
                    assessmentType: row[4],
                    required: row[5]?.toLowerCase() === 'true',
                });
            }
        } else if (type === 'activity') {
            // หา activity name
            let activityName = '';
            for (let i = 0; i < data.length; i++) {
                if (data[i][0]?.toLowerCase().includes('question activity')) {
                    activityName = data[i + 1]?.[0] || '';
                    // หา header
                    const headerIdx = i + 2;
                    for (let j = headerIdx + 1; j < data.length; j++) {
                        const row = data[j];
                        if (!row[1] || !row[2]) break;
                        questions.push({
                            activityName,
                            question: { th: row[1], en: row[2] },
                            status: row[3],
                            required: row[4]?.toLowerCase() === 'true',
                        });
                    }
                }
            }
        }
        return questions;
    }

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
                                <Button
                                    color="secondary"
                                    variant="bordered"
                                    className="ml-2"
                                    isLoading={isImporting}
                                    disabled={isImporting}
                                    onPress={() => { setImportType('test'); fileInputRef.current?.click(); }}
                                >
                                    Import Questions
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
                                        className="max-h-60 overflow-auto"
                                        items={[
                                            { key: "", label: "All Activities" },
                                            ...(activities?.map(activity => ({
                                                key: activity._id,
                                                label: activity.acronym
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
                                <div className="flex items-center">
                                    <Button
                                        color="primary"
                                        variant="flat"
                                        startContent={<Eye size={20} />}
                                        onPress={() => actions.openPreviewAllModal('activity')}
                                    >
                                        Preview Activity Questions
                                    </Button>
                                    <Button
                                        color="secondary"
                                        variant="bordered"
                                        className="ml-2"
                                        isLoading={isImporting}
                                        disabled={isImporting}
                                        onPress={() => { setImportType('activity'); fileInputRef.current?.click(); }}
                                    >
                                        Import Questions
                                    </Button>
                                </div>
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
            {/* File input ซ่อน */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                style={{ display: 'none' }}
                onChange={handleImport}
            />
        </>
    );
}