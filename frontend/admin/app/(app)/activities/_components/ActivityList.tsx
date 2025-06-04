import { Activities } from "@/types/activities";

interface ActivityListProps {
    activities?: Activities[];
    isLoading: boolean;
    onEditActivity: (activity: Activities) => void;
    onDeleteActivity: (activity: Activities) => void;
}

export function ActivityList({ activities, isLoading, onEditActivity, onDeleteActivity }: ActivityListProps) {
    return <div>ActivityList</div>;
}