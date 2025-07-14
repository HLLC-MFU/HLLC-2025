import React, { useMemo } from "react";
import { Users, Download } from "lucide-react";
import { StudentDetail } from "@/types/assessment";
import { getProgressColor } from "./utils/assessment-utils";
import {
    Table,
    TableHeader,
    TableBody,
    TableColumn,
    TableRow,
    TableCell,
    Button,
    Chip,
    Pagination,
    Card,
    CardHeader,
    CardBody
} from "@heroui/react";

interface CustomStudentDetailsTableProps {
    students: StudentDetail[];
    filteredCount: number;
    page: number;
    rowsPerPage: number;
    onPageChange: (page: number) => void;
    onExportCSV: () => void;
    searchQuery: string;
    userType: string;
    school: string;
    major: string;
}

export function CustomStudentDetailsTable({
    students,
    filteredCount,
    page,
    rowsPerPage,
    onPageChange,
    onExportCSV,
    searchQuery,
    userType,
    school,
    major
}: CustomStudentDetailsTableProps) {
    const paginatedStudents = students.slice((page - 1) * rowsPerPage, page * rowsPerPage);
    const hasFilters = searchQuery || userType !== "All" || school !== "All" || major !== "All";

    const skillColumns = useMemo(() => {
        if (!students || students.length === 0) return [];
        const allSkillNames = new Set<string>();
        students.forEach(student => {
            if (student.skillRatings) {
                Object.keys(student.skillRatings).forEach(skill => allSkillNames.add(skill));
            }
        });
        return Array.from(allSkillNames).sort();
    }, [students]);

    // Combine static and dynamic columns
    const columns = useMemo(() => [
        { key: "studentId", label: "Student ID" },
        { key: "name", label: "Name" },
        { key: "school", label: "School" },
        { key: "major", label: "Major" },
        { key: "submit", label: "Submit" },
        ...skillColumns.map(skill => ({ key: skill, label: skill }))
    ], [skillColumns]);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Student Details</h3>
                </div>
                <div className="flex items-center gap-2">
                    <Chip color="primary" variant="flat">
                        {filteredCount} Students
                    </Chip>
                    <Button
                        color="primary"
                        variant="flat"
                        startContent={<Download className="w-4 h-4" />}
                        onPress={onExportCSV}
                        isDisabled={students.length === 0}
                    >
                        Export CSV
                    </Button>
                </div>
            </CardHeader>
            <CardBody>
                <div className="rounded-lg border border-default-200">
                    <Table aria-label="Student details table">
                        <TableHeader>
                            {columns.map(column => (
                                <TableColumn key={column.key}>{column.label}</TableColumn>
                            ))}
                        </TableHeader>
                        <TableBody
                            emptyContent={
                                <div className="py-8 text-center text-default-400">
                                    {hasFilters
                                        ? "No students match your filters"
                                        : "No student data available"}
                                </div>
                            }
                        >
                            {paginatedStudents.map((student) => {
                                const cells = [
                                    <TableCell key="username">{student.username}</TableCell>,
                                    <TableCell key="name">{student.name || "N/A"}</TableCell>,
                                    <TableCell key="school">{student.school || "N/A"}</TableCell>,
                                    <TableCell key="major">{student.major || "N/A"}</TableCell>,
                                    <TableCell key="status">
                                        <Chip
                                            size="sm"
                                            color={student.completed ? "success" : "warning"}
                                            variant="flat"
                                        >
                                            {student.completed ? "Completed" : "In Progress"}
                                        </Chip>
                                    </TableCell>,
                                    ...skillColumns.map(skill => (
                                        <TableCell key={skill}>
                                            {student.skillRatings?.[skill] ?? "N/A"}
                                        </TableCell>
                                    ))
                                ];

                                return (
                                    <TableRow key={student.userId}>
                                        {cells}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                {students.length > rowsPerPage && (
                    <div className="flex justify-center mt-4">
                        <Pagination
                            total={Math.ceil(students.length / rowsPerPage)}
                            page={page}
                            onChange={onPageChange}
                            showControls
                            classNames={{
                                cursor: "bg-primary",
                            }}
                        />
                    </div>
                )}
            </CardBody>
        </Card>
    );
} 