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
} from "@heroui/react";
import { AssessmentType } from "@/types/assessment";
import { useAssessment } from "@/hooks/useAssessment";
import { mockUserStats, mockSkillQuestions } from "@/mocks/assessmentData";
import { Users, UserCheck, FileCheck, Clock, Award, TrendingUp, Filter, X } from "lucide-react";

interface AssessmentOverviewDashboardProps {
  type: AssessmentType;
}

// Mock data for filters - In real app, this would come from an API
const mockUserTypes = ["All", "Student", "Teacher", "Admin"];
const mockSchools = ["All", "School of Engineering", "School of Science", "School of Arts", "School of Business"];
const mockMajors = ["All", "Computer Science", "Electrical Engineering", "Mechanical Engineering", "Business Administration", "Arts & Design"];

export default function AssessmentOverviewDashboard({ type }: AssessmentOverviewDashboardProps) {
  const { questions, results, stats, loading, error, fetchQuestions, fetchResults, fetchStats } = useAssessment();
  
  // Filter states
  const [userType, setUserType] = useState("All");
  const [school, setSchool] = useState("All");
  const [major, setMajor] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Access all mock skill questions for table headers
  const allSkillQuestions = useMemo(() => {
    return [...mockSkillQuestions.lifeSkills, ...mockSkillQuestions.coreSkills];
  }, []);

  useEffect(() => {
    fetchQuestions(type);
    fetchResults(type);
    fetchStats(type);
  }, [type]);

  // Filter results based on selected filters
  const filteredResults = useMemo(() => {
    return results
      .filter(r => r.assessmentType === type)
      .filter(r => {
        const matchesUserType = userType === "All" || r.userType === userType;
        const matchesSchool = school === "All" || r.school === school;
        const matchesMajor = major === "All" || r.major === major;
        const matchesSearch = searchQuery === "" || 
          r.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.userId.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesUserType && matchesSchool && matchesMajor && matchesSearch;
      });
  }, [results, type, userType, school, major, searchQuery]);

  // Reset all filters
  const handleResetFilters = () => {
    setUserType("All");
    setSchool("All");
    setMajor("All");
    setSearchQuery("");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-danger-50 text-danger rounded-lg border border-danger-200">
        <p className="font-medium">Error loading dashboard data</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  const filteredQuestions = questions.filter(q => q.assessmentType === type);

  // Calculate statistics based on filtered results
  const totalQuestions = filteredQuestions.length;
  const totalAttempts = filteredResults.length;
  const uniqueStudents = new Set(filteredResults.map(r => r.userId)).size;
  const averageScore = filteredResults.reduce((acc, curr) => acc + curr.score, 0) / (totalAttempts || 1);
  const completionRate = uniqueStudents / ((stats?.totalStudents || 0) > 0 ? (stats?.totalStudents || 1) : 1);

  // Calculate difficulty distribution
  const difficultyDistribution = {
    easy: filteredQuestions.filter(q => q.difficulty === "easy").length,
    medium: filteredQuestions.filter(q => q.difficulty === "medium").length,
    hard: filteredQuestions.filter(q => q.difficulty === "hard").length,
  };

  const getProgressColor = (value: number, type: "success" | "warning" | "danger" = "success") => {
    if (type === "success") {
      return value >= 70 ? "success" : value >= 50 ? "warning" : "danger";
    }
    if (type === "warning") {
      return value >= 50 ? "success" : value >= 30 ? "warning" : "danger";
    }
    return value >= 30 ? "success" : value >= 15 ? "warning" : "danger";
  };

  return (
    <div className="space-y-8">
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
                {mockUserTypes.map((type) => (
                  <SelectItem key={type}>
                    {type}
                  </SelectItem>
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
                {mockSchools.map((s) => (
                  <SelectItem key={s}>
                    {s}
                  </SelectItem>
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
                {mockMajors.map((m) => (
                  <SelectItem key={m}>
                    {m}
                  </SelectItem>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <Input
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="flat"
                color="danger"
                startContent={<X size={16} />}
                onPress={handleResetFilters}
                className="w-full"
              >
                Reset Filters
              </Button>
            </div>
          </div>
          {/* Active Filters Display */}
          {(userType !== "All" || school !== "All" || major !== "All" || searchQuery) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {userType !== "All" && (
                <Chip
                  onClose={() => setUserType("All")}
                  variant="flat"
                  color="primary"
                >
                  User Type: {userType}
                </Chip>
              )}
              {school !== "All" && (
                <Chip
                  onClose={() => setSchool("All")}
                  variant="flat"
                  color="primary"
                >
                  School: {school}
                </Chip>
              )}
              {major !== "All" && (
                <Chip
                  onClose={() => setMajor("All")}
                  variant="flat"
                  color="primary"
                >
                  Major: {major}
                </Chip>
              )}
              {searchQuery && (
                <Chip
                  onClose={() => setSearchQuery("")}
                  variant="flat"
                  color="primary"
                >
                  Search: {searchQuery}
                </Chip>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* User Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
          <CardBody className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary-100">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-700">Total Users</p>
                <h3 className="text-2xl font-bold mt-1">{mockUserStats.totalUsers.toLocaleString()}</h3>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-success-50 to-success-100 border-success-200">
          <CardBody className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-success-100">
                <UserCheck className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-success-700">Registered Users</p>
                <h3 className="text-2xl font-bold mt-1">{mockUserStats.registeredUsers.toLocaleString()}</h3>
                <Progress
                  value={(mockUserStats.registeredUsers / mockUserStats.totalUsers) * 100}
                  className="mt-3"
                  color="success"
                  size="sm"
                />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-warning-50 to-warning-100 border-warning-200">
          <CardBody className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-warning-100">
                <FileCheck className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium text-warning-700">Submitted Assessments</p>
                <h3 className="text-2xl font-bold mt-1">{mockUserStats.submittedAssessments.toLocaleString()}</h3>
                <Progress
                  value={(mockUserStats.submittedAssessments / mockUserStats.registeredUsers) * 100}
                  className="mt-3"
                  color="warning"
                  size="sm"
                />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-info-50 to-info-100 border-info-200">
          <CardBody className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-info-100">
                <Award className="w-6 h-6 text-info" />
              </div>
              <div>
                <p className="text-sm font-medium text-info-700">Completion Rate</p>
                <h3 className="text-2xl font-bold mt-1">{(completionRate * 100).toFixed(1)}%</h3>
                <Progress
                  value={completionRate * 100}
                  className="mt-3"
                  color={getProgressColor(completionRate * 100)}
                  size="sm"
                />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Life Skills Assessment */}
        <Card>
          <CardHeader className="flex items-center gap-2 pb-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Life Skills Assessment</h3>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="space-y-6">
              {mockSkillQuestions.lifeSkills.map((question) => (
                <div key={question.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Tooltip content={question.text}>
                      <span className="text-sm line-clamp-1">{question.text}</span>
                    </Tooltip>
                    <Chip
                      size="sm"
                      color={getProgressColor(question.averageScore * 20)}
                      variant="flat"
                    >
                      {question.averageScore.toFixed(2)}
                    </Chip>
                  </div>
                  <Progress
                    value={(question.averageScore / 5) * 100}
                    color={getProgressColor(question.averageScore * 20)}
                    size="sm"
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Core Skills Assessment */}
        <Card>
          <CardHeader className="flex items-center gap-2 pb-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Core Skills Assessment</h3>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="space-y-6">
              {mockSkillQuestions.coreSkills.map((skill) => (
                <div key={skill.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Tooltip content={skill.text}>
                      <span className="text-sm line-clamp-1">{skill.text}</span>
                    </Tooltip>
                    <Chip
                      size="sm"
                      color={getProgressColor(skill.averageScore * 20)}
                      variant="flat"
                    >
                      {skill.averageScore.toFixed(2)}
                    </Chip>
                  </div>
                  <Progress
                    value={(skill.averageScore / 5) * 100}
                    color={getProgressColor(skill.averageScore * 20)}
                    size="sm"
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Question Performance */}
      <Card>
        <CardHeader className="flex items-center gap-2 pb-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Question Performance</h3>
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="space-y-6">
            {filteredQuestions.map((question) => {
              const questionResults = filteredResults.filter(r => r.questionId === question._id);
              const correctAnswers = questionResults.filter(r => r.isCorrect).length;
              const averageScore = questionResults.length > 0
                ? (correctAnswers / questionResults.length) * 100
                : 0;

              return (
                <div key={question._id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Tooltip content={question.text}>
                      <span className="text-sm line-clamp-1">{question.text}</span>
                    </Tooltip>
                    <div className="flex items-center gap-2">
                      <Chip
                        size="sm"
                        color={getProgressColor(averageScore)}
                        variant="flat"
                      >
                        {averageScore.toFixed(1)}%
                      </Chip>
                      <Chip
                        size="sm"
                        color={getDifficultyColor(question.difficulty)}
                        variant="flat"
                      >
                        {question.difficulty}
                      </Chip>
                    </div>
                  </div>
                  <Progress
                    value={averageScore}
                    color={getProgressColor(averageScore)}
                    size="sm"
                    className="h-2"
                  />
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Student Results Table */}
      <Card>
        <CardHeader className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Student Results</h3>
          </div>
          <Chip color="primary" variant="flat">
            {filteredResults.filter(result => result.skillAnswers && Object.keys(result.skillAnswers).length > 0).length} Results
          </Chip>
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="overflow-x-auto">
            <Table
              aria-label="Student assessment results"
              classNames={{
                wrapper: "min-h-[400px]",
              }}
            >
              <TableHeader>
                <TableColumn key="studentId">Student ID</TableColumn>
                <TableColumn key="name">Name</TableColumn>
                <TableColumn key="school">School</TableColumn>
                <TableColumn key="major">Major</TableColumn>
                <TableColumn key="submit">Submit</TableColumn>
                {allSkillQuestions.map((skill) => (
                  <TableColumn key={skill.id} className="text-center">
                    <Tooltip content={skill.text}>
                      <span className="line-clamp-2 text-sm">{skill.text}</span>
                    </Tooltip>
                  </TableColumn>
                ))}
              </TableHeader>
              <TableBody
                emptyContent={
                  <div className="py-8 text-center text-default-400">
                    {searchQuery || userType !== "All" || school !== "All" || major !== "All"
                      ? "No results match your filters"
                      : "No assessment results available"}
                  </div>
                }
              >
                {filteredResults
                  .filter(result => result.skillAnswers && Object.keys(result.skillAnswers).length > 0) // Only show entries with skill answers
                  .map((result) => (
                    <TableRow key={result._id}>
                      <TableCell key="userId">{result.userId}</TableCell>
                      <TableCell key="userName">{result.userName}</TableCell>
                      <TableCell key="school">{result.school || "N/A"}</TableCell>
                      <TableCell key="major">{result.major || "N/A"}</TableCell>
                      <TableCell key="submitted">
                        <Chip
                          size="sm"
                          color={result.submitted ? "success" : "danger"}
                          variant="flat"
                        >
                          {result.submitted ? "true" : "false"}
                        </Chip>
                      </TableCell>
                      {allSkillQuestions.map((skill) => (
                        <TableCell key={skill.id} className="text-center">
                          {result.skillAnswers[skill.id] !== undefined ? result.skillAnswers[skill.id] : '-'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
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