"use client";

import { useEffect } from "react";
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
} from "@heroui/react";
import { mockUserStats, mockSkillQuestions, mockStudentResults } from "@/mocks/assessmentData";

export default function SkillAssessmentDashboard() {
  // In a real app, this would come from an API
  const userStats = mockUserStats;
  const skillQuestions = mockSkillQuestions;
  const studentResults = mockStudentResults;

  return (
    <div className="space-y-6">
      {/* User Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h4 className="text-sm font-medium">All Users</h4>
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold">{userStats.totalUsers.toLocaleString()}</div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h4 className="text-sm font-medium">Registered Users</h4>
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold">{userStats.registeredUsers.toLocaleString()}</div>
            <Progress
              value={(userStats.registeredUsers / userStats.totalUsers) * 100}
              className="mt-2"
              color="success"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h4 className="text-sm font-medium">Submitted Assessments</h4>
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold">{userStats.submittedAssessments.toLocaleString()}</div>
            <Progress
              value={(userStats.submittedAssessments / userStats.registeredUsers) * 100}
              className="mt-2"
              color="warning"
            />
          </CardBody>
        </Card>
      </div>

      {/* Life Skills Section */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Life Skills Assessment</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {skillQuestions.lifeSkills.map((question) => (
              <div key={question.id}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">{question.text}</span>
                  <span className="text-sm font-medium">
                    {question.averageScore.toFixed(2)}
                  </span>
                </div>
                <Progress
                  value={(question.averageScore / 5) * 100}
                  color={
                    question.averageScore >= 4
                      ? "success"
                      : question.averageScore >= 3
                      ? "warning"
                      : "danger"
                  }
                />
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Core Skills Section */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Core Skills Assessment</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {skillQuestions.coreSkills.map((skill) => (
              <div key={skill.id}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">{skill.text}</span>
                  <span className="text-sm font-medium">
                    {skill.averageScore.toFixed(2)}
                  </span>
                </div>
                <Progress
                  value={(skill.averageScore / 5) * 100}
                  color={
                    skill.averageScore >= 4
                      ? "success"
                      : skill.averageScore >= 3
                      ? "warning"
                      : "danger"
                  }
                />
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Student Results Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Student Assessment Results</h3>
        </CardHeader>
        <CardBody>
          <Table aria-label="Student assessment results">
            <TableHeader>
              <TableColumn>Student ID</TableColumn>
              <TableColumn>Name</TableColumn>
              <TableColumn>School</TableColumn>
              <TableColumn>Major</TableColumn>
              <TableColumn>Status</TableColumn>
              <TableColumn>Submitted At</TableColumn>
              <TableColumn>Average Score</TableColumn>
            </TableHeader>
            <TableBody>
              {studentResults.map((student) => {
                const answers = Object.values(student.answers);
                const averageScore = answers.length > 0
                  ? answers.reduce((a, b) => a + b, 0) / answers.length
                  : 0;

                return (
                  <TableRow key={student.studentId}>
                    <TableCell>{student.studentId}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.school}</TableCell>
                    <TableCell>{student.major}</TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={student.submitted ? "success" : "danger"}
                      >
                        {student.submitted ? "Submitted" : "Not Submitted"}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {student.submittedAt
                        ? new Date(student.submittedAt).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {student.submitted ? (
                        <div className="flex items-center gap-2">
                          <Progress
                            value={(averageScore / 5) * 100}
                            size="sm"
                            className="w-24"
                            color={
                              averageScore >= 4
                                ? "success"
                                : averageScore >= 3
                                ? "warning"
                                : "danger"
                            }
                          />
                          <span className="text-sm">{averageScore.toFixed(2)}</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
} 