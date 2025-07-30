import { Assessment, AssessmentQuestion } from "@/types/assessment";
import {
    Autocomplete,
    AutocompleteItem,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow
} from "@heroui/react";
import { Key, useState } from "react";

type ListAssessments = {
    assessments: Assessment[];
}

export default function ListAssessments({
    assessments,
}: ListAssessments) {
    const [selectedAssessment, setSelectedAssessment] = useState<Key | null>(0);
    const assessmentNotNull = assessments?.[Number(selectedAssessment) ?? 0]?.assessments?.filter(a => a.averageAnswer !== null);

    return (
        <div className="flex-col flex gap-6 w-full">
            {/* Select Assessment */}
            <Autocomplete
                label="Select an assessment"
                selectedKey={selectedAssessment?.toString()}
                onSelectionChange={key => setSelectedAssessment(Number(key))}
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
                            {(assessmentNotNull?.reduce((sum, answer) => sum + (answer.averageAnswer ?? 0), 0) / assessmentNotNull?.length).toFixed(2)}
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
                                    <TableCell>{assessment.name.en}</TableCell>
                                    <TableCell>{assessment.count}</TableCell>
                                    <TableCell>{assessment.averageAnswer?.toFixed(2)}</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div >
    )
}