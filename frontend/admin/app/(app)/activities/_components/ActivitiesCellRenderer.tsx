import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react";
import { Activities } from "@/types/activities";
import { EllipsisVertical, Pen, Trash } from "lucide-react";

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
                <Dropdown>
                    <DropdownTrigger>
                        <Button isIconOnly size="sm" variant="light">
                            <EllipsisVertical className="text-default-400" />
                        </Button>
                    </DropdownTrigger>
                    <DropdownMenu>
                        <DropdownItem
                            key="edit"
                            startContent={<Pen size={16} />}
                            onPress={() => onEdit(activity)}
                        >
                            Edit
                        </DropdownItem>
                        <DropdownItem
                            key="delete"
                            className="text-danger"
                            color="danger"
                            startContent={<Trash size={16} />}
                            onPress={() => onDelete(activity)}
                        >
                            Delete
                        </DropdownItem>
                    </DropdownMenu>
                </Dropdown>
            );
        default:
            return <span>-</span>;
    }
}
