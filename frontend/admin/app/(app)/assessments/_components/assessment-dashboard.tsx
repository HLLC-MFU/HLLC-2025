"use client";

import {useEffect} from "react";
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
import { AssessmentResult, AssessmentStats } from "@/types/assessment";
import { useAssessment } from "@/hooks/useAssessment";

interface AssessmentDashboardProps {
  type: "pretest" | "posttest";
}

export default function AssessmentDashboard({ type }: AssessmentDashboardProps) {
  const { results, stats, loading, error, fetchResults, fetchStats } = useAssessment();

  useEffect(() => {
    fetchResults(type);
    fetchStats(type);
  }, [type]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-danger">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h4 className="text-sm font-medium">Total Questions</h4>
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold">{stats?.totalQuestions || 0}</div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h4 className="text-sm font-medium">Average Score</h4>
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold">
              {stats?.averageScore ? `${(stats.averageScore * 100).toFixed(1)}%` : "0%"}
            </div>
            <Progress
              value={stats?.averageScore ? stats.averageScore * 100 : 0}
              className="mt-2"
              color={
                stats?.averageScore && stats.averageScore >= 0.7
                  ? "success"
                  : stats?.averageScore && stats.averageScore >= 0.5
                  ? "warning"
                  : "danger"
              }
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h4 className="text-sm font-medium">Completion Rate</h4>
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold">
              {stats?.completionRate ? `${(stats.completionRate * 100).toFixed(1)}%` : "0%"}
            </div>
            <Progress
              value={stats?.completionRate ? stats.completionRate * 100 : 0}
              className="mt-2"
              color={
                stats?.completionRate && stats.completionRate >= 0.7
                  ? "success"
                  : stats?.completionRate && stats.completionRate >= 0.5
                  ? "warning"
                  : "danger"
              }
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h4 className="text-sm font-medium">Total Attempts</h4>
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold">{stats?.totalAttempts || 0}</div>
          </CardBody>
        </Card>
      </div>

      {/* Difficulty Distribution */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Difficulty Distribution</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Easy</span>
                <span className="text-sm font-medium">
                  {stats?.difficultyDistribution.easy || 0}
                </span>
              </div>
              <Progress
                value={
                  stats?.difficultyDistribution.easy
                    ? (stats.difficultyDistribution.easy / stats.totalQuestions) * 100
                    : 0
                }
                color="success"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Medium</span>
                <span className="text-sm font-medium">
                  {stats?.difficultyDistribution.medium || 0}
                </span>
              </div>
              <Progress
                value={
                  stats?.difficultyDistribution.medium
                    ? (stats.difficultyDistribution.medium / stats.totalQuestions) * 100
                    : 0
                }
                color="warning"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Hard</span>
                <span className="text-sm font-medium">
                  {stats?.difficultyDistribution.hard || 0}
                </span>
              </div>
              <Progress
                value={
                  stats?.difficultyDistribution.hard
                    ? (stats.difficultyDistribution.hard / stats.totalQuestions) * 100
                    : 0
                }
                color="danger"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Recent Results Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Recent Results</h3>
        </CardHeader>
        <CardBody>
          <Table aria-label="Recent assessment results">
            <TableHeader>
              <TableColumn>Student</TableColumn>
              <TableColumn>Question</TableColumn>
              <TableColumn>Score</TableColumn>
              <TableColumn>Time Spent</TableColumn>
              <TableColumn>Status</TableColumn>
            </TableHeader>
            <TableBody>
              {results.slice(0, 5).map((result) => (
                <TableRow key={result._id}>
                  <TableCell>{result.userName}</TableCell>
                  <TableCell className="max-w-md truncate">
                    {result.questionText}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      color={result.isCorrect ? "success" : "danger"}
                    >
                      {result.score}%
                    </Chip>
                  </TableCell>
                  <TableCell>{result.timeSpent}s</TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      color={result.isCorrect ? "success" : "danger"}
                    >
                      {result.isCorrect ? "Correct" : "Incorrect"}
                    </Chip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
} 