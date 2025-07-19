import { Button } from "@heroui/react";
import { Activities } from "@/types/activities";

export type ActivitiesColumnKey =
    | "acronym"
    | "name"
    | "location"
    | "startAt"
    | "endAt"
    | "isOpen"
    | "isVisible"
    | "isProgressCount"
    | "actions";

type Props = {
    activity: Activities;
    columnKey: ActivitiesColumnKey;
    onEdit: (activity: Activities) => void;
    onDelete: (activity: Activities) => void;
};

export default function ActivitiesCellRenderer({
    activity,
    columnKey,
    onEdit,
    onDelete,
}: Props) {
    switch (columnKey) {
        case "acronym":
            return <span>{activity.acronym}</span>;
        case "name":
            return <span>{activity.name?.en || "N/A"}</span>;
        case "location":
            return <span>{activity.location?.en || "N/A"}</span>;
        case "startAt":
            return (
                <span>
                    {activity.metadata?.startAt
                        ? new Date(activity.metadata.startAt).toLocaleString()
                        : "N/A"}
                </span>
            );
        case "endAt":
            return (
                <span>
                    {activity.metadata?.endAt
                        ? new Date(activity.metadata.endAt).toLocaleString()
                        : "N/A"}
                </span>
            );
        case "isOpen":
            return <span>{activity.metadata?.isOpen ? "Open" : "Closed"}</span>;
        case "isVisible":
            return <span>{activity.metadata?.isVisible ? "Yes" : "No"}</span>;
        case "isProgressCount":
            return <span>{activity.metadata?.isProgressCount ? "Yes" : "No"}</span>;
        case "actions":
            return (
                <div className="flex gap-2 justify-center">
                    <Button
                        size="sm"
                        color="primary"
                        onPress={() => onEdit(activity)}
                    >
                        Edit
                    </Button>
                    <Button
                        size="sm"
                        color="danger"
                        variant="flat"
                        onPress={() => onDelete(activity)}
                    >
                        Delete
                    </Button>
                </div>
            );
        default:
            return <span>-</span>;
    }
}
