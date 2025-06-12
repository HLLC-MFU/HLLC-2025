"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Progress,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Chip,
  Spinner,
  Divider,
  Tooltip,
  Select,
  SelectItem,
  Button,
  Input,
  Pagination,
} from "@heroui/react";
import { 
    AssessmentType, 
    TestAnswer,
    AssessmentOverviewDashboardProps,
    StudentDetail,
    UserDetails,
    ScoreDistribution,
    DifficultyDistribution,
    QuestionTypeDistribution,
    AssessmentStats,
    ChipColor,
    MockFilterData
} from "@/types/assessment";
import { Users, UserCheck, FileCheck, Clock, Award, TrendingUp, Filter, X, Search, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

// Mock data for filters - In real app, this would come from an API
const mockFilterData: MockFilterData = {
    userTypes: ["All", "Student", "Teacher", "Admin"],
    schools: ["All", "School of Engineering", "School of Science", "School of Arts", "School of Business"],
    majors: ["All", "Computer Science", "Electrical Engineering", "Mechanical Engineering", "Business Administration", "Arts & Design"]
};

export default function AssessmentOverviewDashboard({ 
    type, 
    answers,
    loading 
}: AssessmentOverviewDashboardProps) {
    // Filter states
    const [userType, setUserType] = useState("All");
    const [school, setSchool] = useState("All");
    const [major, setMajor] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const rowsPerPage = 10;

    // Calculate statistics from answers
    const stats = useMemo(() => ({
        totalStudents: new Set(answers.map(a => a.userId)).size,
        totalAttempts: answers.length,
        averageScore: calculateAverageScore(answers),
        completionRate: calculateCompletionRate(answers),
        averageTimeSpent: calculateAverageTimeSpent(answers),
        difficultyDistribution: calculateDifficultyDistribution(answers),
        questionTypeDistribution: calculateQuestionTypeDistribution(answers),
        scoreDistribution: calculateScoreDistribution(answers),
        studentDetails: calculateStudentDetails(answers),
    }), [answers]);

    // Filter answers based on selected filters
    const filteredAnswers = useMemo(() => {
        return answers.filter(answer => {
            const matchesUserType = userType === "All" || answer.user?.userType === userType;
            const matchesSchool = school === "All" || answer.user?.school === school;
            const matchesMajor = major === "All" || answer.user?.major === major;
            const matchesSearch = searchQuery === "" || 
                (answer.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                answer.userId.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesUserType && matchesSchool && matchesMajor && matchesSearch;
        });
    }, [answers, userType, school, major, searchQuery]);

    // Paginate student details
    const paginatedStudentDetails = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return stats.studentDetails.slice(start, end);
    }, [stats.studentDetails, page]);

    // Function to convert data to CSV format
    const convertToCSV = (data: any[]) => {
        const headers = [
            "Student ID",
            "Name",
            "School",
            "Major",
            "Score",
            "Time Spent (min)",
            "Status",
            "Completed Questions",
            "Last Updated"
        ];

        const rows = data.map(student => [
            student.userId,
            student.name || "N/A",
            student.school || "N/A",
            student.major || "N/A",
            `${student.score}%`,
            student.timeSpent,
            student.completed ? "Completed" : "In Progress",
            student.completedQuestions || 0,
            new Date().toLocaleDateString()
        ]);

        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(","))
            .join("\n");
    };

    // Function to download CSV
    const downloadCSV = () => {
        const csv = convertToCSV(stats.studentDetails);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        
        link.setAttribute("href", url);
        link.setAttribute("download", `${type}-assessment-results-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = "hidden";
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filter Section */}
            <Card>
                <CardHeader className="flex items-center gap-2 pb-2">
                    <Filter className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Filters</h3>
                </CardHeader>
                <Divider />
                <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">User Type</label>
                            <Select
                                selectedKeys={[userType]}
                                onSelectionChange={(keys) => setUserType(Array.from(keys)[0] as string)}
                                className="w-full"
                            >
                                {mockFilterData.userTypes.map((type) => (
                                    <SelectItem key={type}>{type}</SelectItem>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">School</label>
                            <Select
                                selectedKeys={[school]}
                                onSelectionChange={(keys) => setSchool(Array.from(keys)[0] as string)}
                                className="w-full"
                            >
                                {mockFilterData.schools.map((s) => (
                                    <SelectItem key={s}>{s}</SelectItem>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Major</label>
                            <Select
                                selectedKeys={[major]}
                                onSelectionChange={(keys) => setMajor(Array.from(keys)[0] as string)}
                                className="w-full"
                            >
                                {mockFilterData.majors.map((m) => (
                                    <SelectItem key={m}>{m}</SelectItem>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Search</label>
                            <Input
                                placeholder="Search by name or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                startContent={<Search className="text-default-400" size={20} />}
                                className="w-full"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button
                                variant="flat"
                                color="danger"
                                startContent={<X size={16} />}
                                onPress={() => {
                                    setUserType("All");
                                    setSchool("All");
                                    setMajor("All");
                                    setSearchQuery("");
                                }}
                                className="w-full"
                            >
                                Reset Filters
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <p className="text-sm font-medium">Total Students</p>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardBody>
                        <div className="text-2xl font-bold">{stats.totalStudents}</div>
                        <Progress
                            value={stats.completionRate}
                            className="mt-2"
                            color={getProgressColor(stats.completionRate)}
                            size="sm"
                        />
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <p className="text-sm font-medium">Completion Rate</p>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardBody>
                        <div className="text-2xl font-bold">{stats.completionRate}%</div>
                        <Progress
                            value={stats.completionRate}
                            className="mt-2"
                            color={getProgressColor(stats.completionRate)}
                            size="sm"
                        />
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <p className="text-sm font-medium">Average Score</p>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardBody>
                        <div className="text-2xl font-bold">{stats.averageScore}%</div>
                        <Progress
                            value={stats.averageScore}
                            className="mt-2"
                            color={getProgressColor(stats.averageScore)}
                            size="sm"
                        />
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <p className="text-sm font-medium">Average Time</p>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardBody>
                        <div className="text-2xl font-bold">{stats.averageTimeSpent} min</div>
                        <div className="text-sm text-default-400 mt-1">
                            Per student
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Score Distribution Chart */}
            <Card>
                <CardHeader className="flex items-center gap-2 pb-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Score Distribution</h3>
                </CardHeader>
                <Divider />
                <CardBody>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.scoreDistribution}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="range" />
                                <YAxis />
                                <RechartsTooltip />
                                <Bar dataKey="count" fill="#0070F0" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardBody>
            </Card>

            {/* Student Details Table */}
            <Card>
                <CardHeader className="flex items-center justify-between pb-2">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">Student Details</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <Chip color="primary" variant="flat">
                            {filteredAnswers.length} Students
                        </Chip>
                        <Button
                            color="primary"
                            variant="flat"
                            startContent={<Download className="w-4 h-4" />}
                            onPress={downloadCSV}
                            isDisabled={stats.studentDetails.length === 0}
                        >
                            Export CSV
                        </Button>
                    </div>
                </CardHeader>
                <Divider />
                <CardBody>
                    <Table aria-label="Student assessment details">
                        <TableHeader>
                            <TableColumn>Student ID</TableColumn>
                            <TableColumn>Name</TableColumn>
                            <TableColumn>School</TableColumn>
                            <TableColumn>Major</TableColumn>
                            <TableColumn>Score</TableColumn>
                            <TableColumn>Time Spent</TableColumn>
                            <TableColumn>Status</TableColumn>
                        </TableHeader>
                        <TableBody
                            emptyContent={
                                <div className="py-8 text-center text-default-400">
                                    {searchQuery || userType !== "All" || school !== "All" || major !== "All"
                                        ? "No students match your filters"
                                        : "No student data available"}
                                </div>
                            }
                        >
                            {paginatedStudentDetails.map((student) => (
                                <TableRow key={student.userId}>
                                    <TableCell>{student.userId}</TableCell>
                                    <TableCell>{student.name || "N/A"}</TableCell>
                                    <TableCell>{student.school || "N/A"}</TableCell>
                                    <TableCell>{student.major || "N/A"}</TableCell>
                                    <TableCell>
                                        <Chip
                                            size="sm"
                                            color={getProgressColor(student.score)}
                                            variant="flat"
                                        >
                                            {student.score}%
                                        </Chip>
                                    </TableCell>
                                    <TableCell>{student.timeSpent} min</TableCell>
                                    <TableCell>
                                        <Chip
                                            size="sm"
                                            color={student.completed ? "success" : "warning"}
                                            variant="flat"
                                        >
                                            {student.completed ? "Completed" : "In Progress"}
                                        </Chip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {stats.studentDetails.length > rowsPerPage && (
                        <div className="flex justify-center mt-4">
                            <Pagination
                                total={Math.ceil(stats.studentDetails.length / rowsPerPage)}
                                page={page}
                                onChange={setPage}
                                showControls
                            />
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}

// Helper functions to calculate statistics
function calculateAverageScore(answers: TestAnswer[]): number {
    if (answers.length === 0) return 0;
    const scores = answers.map(a => {
        if (typeof a.answer === 'number') return a.answer;
        if (Array.isArray(a.answer)) return a.answer.length;
        return 0;
    });
    return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100);
}

function calculateCompletionRate(answers: TestAnswer[]): number {
    if (answers.length === 0) return 0;
    const uniqueUsers = new Set(answers.map(a => a.userId)).size;
    // Assuming each user should answer 10 questions
    const expectedAnswers = uniqueUsers * 10;
    return Math.round((answers.length / expectedAnswers) * 100);
}

function calculateAverageTimeSpent(answers: TestAnswer[]): number {
    if (answers.length === 0) return 0;
    const times = answers.map(a => {
        const created = new Date(a.createdAt).getTime();
        const updated = new Date(a.updatedAt).getTime();
        return (updated - created) / (1000 * 60); // Convert to minutes
    });
    return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
}

function calculateScoreDistribution(answers: TestAnswer[]): ScoreDistribution[] {
    const ranges = [
        { min: 0, max: 20, label: "0-20%" },
        { min: 21, max: 40, label: "21-40%" },
        { min: 41, max: 60, label: "41-60%" },
        { min: 61, max: 80, label: "61-80%" },
        { min: 81, max: 100, label: "81-100%" },
    ];

    // Calculate scores for each user
    const userScores = new Map<string, number[]>();
    answers.forEach(answer => {
        const score = typeof answer.answer === 'number' ? answer.answer :
                     Array.isArray(answer.answer) ? answer.answer.length : 0;
        const scores = userScores.get(answer.userId) || [];
        scores.push(score);
        userScores.set(answer.userId, scores);
    });

    // Calculate average score for each user
    const averageScores = Array.from(userScores.values()).map(scores => 
        Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100)
    );

    // Count scores in each range
    return ranges.map(range => ({
        range: range.label,
        count: averageScores.filter(score => score >= range.min && score <= range.max).length
    }));
}

function calculateStudentDetails(answers: TestAnswer[]): StudentDetail[] {
    const userDetails = new Map<string, UserDetails>();

    // Collect all answers for each user
    answers.forEach(answer => {
        const details = userDetails.get(answer.userId) || {
            userId: answer.userId,
            name: answer.user?.name || "N/A",
            school: answer.user?.school,
            major: answer.user?.major,
            scores: [],
            timeSpent: [],
            answerCount: 0,
            lastUpdated: new Date(answer.updatedAt)
        };

        const score = typeof answer.answer === 'number' ? answer.answer :
                     Array.isArray(answer.answer) ? answer.answer.length : 0;
        details.scores.push(score);

        const timeSpent = (new Date(answer.updatedAt).getTime() - new Date(answer.createdAt).getTime()) / (1000 * 60);
        details.timeSpent.push(timeSpent);
        details.answerCount++;

        // Update lastUpdated if this answer is more recent
        const answerDate = new Date(answer.updatedAt);
        if (answerDate > details.lastUpdated) {
            details.lastUpdated = answerDate;
        }

        userDetails.set(answer.userId, details);
    });

    // Calculate final statistics for each user
    return Array.from(userDetails.values()).map(details => ({
        userId: details.userId,
        name: details.name,
        school: details.school,
        major: details.major,
        score: Math.round((details.scores.reduce((a, b) => a + b, 0) / details.scores.length) * 100),
        timeSpent: Math.round(details.timeSpent.reduce((a, b) => a + b, 0) / details.timeSpent.length),
        completed: details.answerCount >= 10, // Assuming 10 questions is complete
        completedQuestions: details.answerCount,
        lastUpdated: details.lastUpdated
    }));
}

function calculateDifficultyDistribution(answers: TestAnswer[]): DifficultyDistribution {
    const difficulties = answers.reduce((acc, curr) => {
        const difficulty = curr.question?.difficulty || "medium";
        acc[difficulty] = (acc[difficulty] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return {
        easy: difficulties.easy || 0,
        medium: difficulties.medium || 0,
        hard: difficulties.hard || 0
    };
}

function calculateQuestionTypeDistribution(answers: TestAnswer[]): QuestionTypeDistribution {
    const types = answers.reduce((acc, curr) => {
        const type = curr.question?.type || "text";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return {
        text: types.text || 0,
        rating: types.rating || 0,
        dropdown: types.dropdown || 0,
        checkbox: types.checkbox || 0,
        radio: types.radio || 0
    };
}

function getProgressColor(value: number): "success" | "warning" | "danger" {
    if (value >= 70) return "success";
    if (value >= 40) return "warning";
    return "danger";
}

function getDifficultyColor(difficulty: string) {
    switch (difficulty) {
        case "easy":
            return "success";
        case "medium":
            return "warning";
        case "hard":
            return "danger";
        default:
            return "default";
    }
} 