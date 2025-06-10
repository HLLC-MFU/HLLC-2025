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
import { ActivityProgress } from "@/types/assessment";
import { useAssessment } from "@/hooks/useAssessment";

export default function ActivityDashboard() {
  const { activityProgress, loading, error, fetchActivityProgress } = useAssessment();

 useEffect(() => {
    fetchActivityProgress();
  }, []);

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

  // Calculate statistics
  const totalActivities = activityProgress.length;
  const completedActivities = activityProgress.filter(
    (activity) => activity.status === "completed"
  ).length;
  const inProgressActivities = activityProgress.filter(
    (activity) => activity.status === "in-progress"
  ).length;
  const notStartedActivities = activityProgress.filter(
    (activity) => activity.status === "not-started"
  ).length;

  const averageProgress =
    activityProgress.reduce((acc, curr) => acc + curr.progress, 0) /
    (totalActivities || 1);

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h4 className="text-sm font-medium">Total Activities</h4>
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold">{totalActivities}</div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h4 className="text-sm font-medium">Average Progress</h4>
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold">
              {`${averageProgress.toFixed(1)}%`}
            </div>
            <Progress
              value={averageProgress}
              className="mt-2"
              color={
                averageProgress >= 70
                  ? "success"
                  : averageProgress >= 50
                  ? "warning"
                  : "danger"
              }
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h4 className="text-sm font-medium">Completed</h4>
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold">{completedActivities}</div>
            <Progress
              value={(completedActivities / totalActivities) * 100}
              className="mt-2"
              color="success"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h4 className="text-sm font-medium">In Progress</h4>
          </CardHeader>
          <CardBody>
            <div className="text-2xl font-bold">{inProgressActivities}</div>
            <Progress
              value={(inProgressActivities / totalActivities) * 100}
              className="mt-2"
              color="warning"
            />
          </CardBody>
        </Card>
      </div>

      {/* Activity Status Distribution */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Activity Status</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Completed</span>
                <span className="text-sm font-medium">{completedActivities}</span>
              </div>
              <Progress
                value={(completedActivities / totalActivities) * 100}
                color="success"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">In Progress</span>
                <span className="text-sm font-medium">{inProgressActivities}</span>
              </div>
              <Progress
                value={(inProgressActivities / totalActivities) * 100}
                color="warning"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Not Started</span>
                <span className="text-sm font-medium">{notStartedActivities}</span>
              </div>
              <Progress
                value={(notStartedActivities / totalActivities) * 100}
                color="danger"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Recent Activity Progress Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Recent Activity Progress</h3>
        </CardHeader>
        <CardBody>
          <Table aria-label="Recent activity progress">
            <TableHeader>
              <TableColumn>Student</TableColumn>
              <TableColumn>Activity</TableColumn>
              <TableColumn>Progress</TableColumn>
              <TableColumn>Status</TableColumn>
              <TableColumn>Last Accessed</TableColumn>
            </TableHeader>
            <TableBody>
              {activityProgress
                .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())
                .slice(0, 5)
                .map((activity) => (
                  <TableRow key={activity._id}>
                    <TableCell>{activity.userName}</TableCell>
                    <TableCell>{activity.activityName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={activity.progress}
                          size="sm"
                          className="w-24"
                          color={
                            activity.progress >= 70
                              ? "success"
                              : activity.progress >= 50
                              ? "warning"
                              : "danger"
                          }
                        />
                        <span className="text-sm">{activity.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={
                          activity.status === "completed"
                            ? "success"
                            : activity.status === "in-progress"
                            ? "warning"
                            : "danger"
                        }
                      >
                        {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {new Date(activity.lastAccessed).toLocaleDateString()}
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