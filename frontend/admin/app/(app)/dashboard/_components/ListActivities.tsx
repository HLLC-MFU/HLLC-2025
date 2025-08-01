import { Assessment, AssessmentQuestion } from "@/types/assessment";
import {
    Autocomplete,
    AutocompleteItem,
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow
} from "@heroui/react";
import { RefreshCcw } from "lucide-react";
import { Key, useState } from "react";
import AssessmentTableSkeleton from "./ActivitiesTableSkeleton";

type ListActivities = {
    assessments: Assessment[];
    isLoading: boolean;
    fetchAssessment: () => void;
}

export default function ListAssessments({
    assessments,
    isLoading,
    fetchAssessment,
}: ListActivities) {
    const [selectedAssessment, setSelectedAssessment] = useState<Key | null>(0);
    const assessmentNotNull = assessments?.[Number(selectedAssessment) ?? 0]?.assessments?.filter(a => a.averageAnswer !== null);

    const exportToCSV = () => {
        if (!assessments || assessments.length === 0) return;

        const headers = [
            'No',
            'Acronym',
            'Name (EN)',
            'Name (TH)',
            'Checkin',
            'Question (EN)',
            'Question (TH)',
            'Average',
            'Count'
        ];
        const rows = assessments.flatMap((assessment, index) =>
            assessment.assessments.map((a) => [
                index + 1,
                assessment.acronym ?? '',
                assessment.name.en ?? '',
                assessment.name.th ?? '',
                assessment.checkin ?? '',
                a.name.en ?? '',
                a.name.th ?? '',
                a.averageAnswer ?? '',
                a.count ?? '',
            ])
        );

        const csvContent = [headers, ...rows]
            .map((row) =>
                row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')
            )
            .join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'activities_data.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Select Assessment */}
            <div className="flex flex-row justify-between">
                <Autocomplete
                    label="Select an activity"
                    labelPlacement="outside-left"
                    selectedKey={selectedAssessment?.toString()}
                    onSelectionChange={key => setSelectedAssessment(Number(key))}
                    variant="bordered"
                >
                    {assessments?.map((assessment, index) => (
                        <AutocompleteItem
                            key={index}
                            textValue={assessment.name.en}
                            startContent={
                                assessment.acronym.includes('-') ? (
                                    <Chip radius="md" className="h-8 bg-gray-200 text-gray-700">{assessment.acronym.split('-')[0]}</Chip>
                                ) : null
                            }
                        >
                            <div className="flex flex-col text-left">
                                <span>{assessment.name.en}</span>
                                <span className="text-sm text-default-500">
                                    ({assessment.name.th})
                                </span>
                            </div>
                        </AutocompleteItem>
                    ))}
                </Autocomplete>
                <div className="flex flex-row gap-2">
                    <Button
                        color="primary"
                        className="px-6"
                        onPress={exportToCSV}
                    >
                        Export CSV
                    </Button>
                    <Button
                        startContent={<RefreshCcw size={18} />}
                        color="primary"
                        onPress={fetchAssessment}
                    >
                        Refresh
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <AssessmentTableSkeleton />
            ) : (
                <>
                    {/* Stat Card */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="text-sm font-medium text-muted-foreground">Total Checkins</div>
                            </CardHeader>
                            <CardBody>
                                <div className="text-2xl font-bold">{assessments?.[Number(selectedAssessment) ?? 0]?.checkin ?? 0}</div>
                            </CardBody>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <div className="text-sm font-medium text-muted-foreground">Overall Assessment Average</div>
                            </CardHeader>
                            <CardBody>
                                <div className="text-2xl font-bold">
                                    {assessmentNotNull && assessmentNotNull.length > 0
                                        ? (assessmentNotNull.reduce((sum, answer) => sum + (answer.averageAnswer ?? 0), 0) / assessmentNotNull.length).toFixed(2)
                                        : '0.00'}
                                </div>
                            </CardBody>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="text-sm font-medium text-muted-foreground">Total Questions</div>
                            </CardHeader>
                            <CardBody>
                                <div className="text-2xl font-bold">
                                    {assessmentNotNull?.length ?? 0}
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    {/* Average Table */}
                    <div className="flex-col flex gap-5 w-full">
                        <div className="flex flex-col gap-4">
                            <Table aria-label="Posttest Averages Table">
                                <TableHeader>
                                    <TableColumn>No</TableColumn>
                                    <TableColumn>Question</TableColumn>
                                    <TableColumn>Count</TableColumn>
                                    <TableColumn>Average</TableColumn>
                                </TableHeader>
                                <TableBody emptyContent="No rows to display" items={assessmentNotNull ?? []}>
                                    {(assessment: AssessmentQuestion) => (
                                        <TableRow key={assessment._id}>
                                            <TableCell>{assessmentNotNull.findIndex(a => a._id === assessment._id) + 1}</TableCell>
                                            <TableCell>
                                                {
                                                    <div className="flex flex-col">
                                                        <span>{assessment.name.en}</span>
                                                        <span className="text-sm text-default-500">
                                                            {assessment.name.th}
                                                        </span>
                                                    </div>
                                                }
                                            </TableCell>
                                            <TableCell>{assessment.count}</TableCell>
                                            <TableCell>{assessment.averageAnswer?.toFixed(2)}</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </>
            )
            }
        </div >
    )
}