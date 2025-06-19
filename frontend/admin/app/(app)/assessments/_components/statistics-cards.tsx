import { Card, CardHeader, CardBody, Progress } from "@heroui/react";
import { Users, UserCheck, Award, Clock } from "lucide-react";
import { getProgressColor } from "./utils/assessment-utils";
import { useStatistics } from "@/hooks/useStatistics";
import { useUsers } from "@/hooks/useUsers";
import { useAssessment } from "@/hooks/useAssessment";
import { ActivityProgress, AssessmentType, RawPretestAnswer, RawPosttestAnswer } from "@/types/assessment";

interface StatisticsCardsProps {
    type: AssessmentType;
}

export function StatisticsCards({ type }: StatisticsCardsProps) {
    const { stats, loading, error } = useStatistics();
    const { users } = useUsers();
    const { activityProgress, pretestProgress, posttestProgress } = useAssessment();

    // Calculate completion rate based on the assessment type
    const progressData: ActivityProgress[] | RawPretestAnswer[] | RawPosttestAnswer[] = type === "pretest" 
        ? pretestProgress 
        : type === "posttest" 
            ? posttestProgress 
            : activityProgress;
    
    // Extract user IDs, handling different data structures
    const usersWithAnswers = new Set(
        progressData.map(progress => {
            if ('userId' in progress) {
                return progress.userId;
            } else if ('user' in progress && progress.user && '_id' in progress.user) {
                return progress.user._id;
            }
            return null; // Should not happen if types are correct
        }).filter(id => id !== null)
    ).size;

    const submitRate = users.length > 0 ? (usersWithAnswers / users.length) * 100 : 0;

    // Get the appropriate title based on type
    const getTitle = () => {
        switch (type) {
            case "pretest":
                return "Pretest Submissions";
            case "posttest":
                return "Posttest Submissions";
            case "activity":
                return "Activity Submissions";
            default:
                return "Submissions";
        }
    };

    // Get the appropriate submission text based on type
    const getSubmissionText = () => {
        switch (type) {
            case "pretest":
                return "pretest";
            case "posttest":
                return "posttest";
            case "activity":
                return "activity";
            default:
                return "assessment";
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                            <div className="h-4 w-4 bg-gray-100 rounded animate-pulse" />
                        </CardHeader>
                        <CardBody>
                            <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" />
                            <div className="h-2 w-full bg-gray-100 rounded animate-pulse mt-2" />
                        </CardBody>
                    </Card>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-danger">
                <p>Failed to load statistics: {error}</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <p className="text-sm font-medium">Total Students</p>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardBody>
                    <div className="text-2xl font-bold">{users.length}</div>
                </CardBody>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <p className="text-sm font-medium">Registered Users</p>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardBody>
                    <div className="text-2xl font-bold">{users.length}</div>
                </CardBody>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <p className="text-sm font-medium">{getTitle()}</p>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardBody>
                    <div className="text-2xl font-bold">{Math.round(submitRate)}%</div>
                    <Progress
                        value={submitRate}
                        className="mt-2"
                        color={getProgressColor(submitRate)}
                        size="sm"
                    />
                    <div className="text-sm text-muted-foreground mt-1">
                        {usersWithAnswers} of {users.length} users submitted {getSubmissionText()}
                    </div>
                </CardBody>
            </Card>
        </div>
    );
} 