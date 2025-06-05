import type { Activities } from "@/types/activities";
import { ActivityCard } from "./ActivityCard";
import { Card, Skeleton } from "@heroui/react";

function ActivitySkeleton() {
    return (
        <Card className="p-4">
            <div className="flex items-center space-x-4">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="flex-1">
                    <Skeleton className="h-6 w-3/4 rounded-lg mb-2" />
                    <Skeleton className="h-4 w-1/2 rounded-lg" />
                </div>
            </div>
        </Card>
    );
}

interface ActivityListProps {
    activities?: Activities[];
    isLoading: boolean;
    onEditActivity: (activity: Activities) => void;
    onDeleteActivity: (activity: Activities) => void;
}

export function ActivityList({ activities, isLoading, onEditActivity, onDeleteActivity }: ActivityListProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <ActivitySkeleton key={i} />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activities?.map((activity) => (
                <ActivityCard
                    key={activity._id}
                    activity={activity}
                    onEdit={onEditActivity}
                    onDelete={onDeleteActivity}
                />
            ))}
        </div>
    );
}