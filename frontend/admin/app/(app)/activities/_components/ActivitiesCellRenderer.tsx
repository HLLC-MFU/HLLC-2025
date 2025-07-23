import { Button, Chip, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react";
import { Activities } from "@/types/activities";
import { EllipsisVertical, Eye, Pen, Trash } from "lucide-react";
import { Lang } from "@/types/lang";

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
    onViewDetail: (activity: Activities) => void;
};

export default function ActivitiesCellRenderer({
    activity,
    columnKey,
    onEdit,
    onDelete,
    onViewDetail,
}: Props) {
    switch (columnKey) {
        case "acronym":
            return <span>{activity.acronym}</span>;
        case "name":
            return (
                <div className="flex flex-col gap-4">
                    {(['en', 'th'] as (keyof Lang)[]).map((lang) => (
                        <div key={lang} className="flex text-sm text-default-900 gap-1">
                            <span className="font-medium text-default-400">
                                {lang.toUpperCase()} :
                            </span>
                            <span>{activity.name?.[lang] || "N/A"}</span>
                        </div>
                    ))}
                </div>
            );
        case "location":
            return (
                <div className="flex flex-col gap-4">
                    {(['en', 'th'] as (keyof Lang)[]).map((lang) => (
                        <div key={lang} className="flex text-sm text-default-900 gap-1">
                            <span className="font-medium text-default-400">
                                {lang.toUpperCase()} :
                            </span>
                            <span>{activity.location?.[lang] || "N/A"}</span>
                        </div>
                    ))}
                </div>
            );
        case "startAt":
            return activity.metadata?.startAt ? (
                <div className="flex flex-col text-sm">
                    <span>{new Date(activity.metadata.startAt).toLocaleDateString()}</span>
                    <span className="text-default-500">{new Date(activity.metadata.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            ) : (
                <span>N/A</span>
            );

        case "endAt":
            return activity.metadata?.endAt ? (
                <div className="flex flex-col text-sm">
                    <span>{new Date(activity.metadata.endAt).toLocaleDateString()}</span>
                    <span className="text-default-500">{new Date(activity.metadata.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            ) : (
                <span>N/A</span>
            );

        case "isOpen":
            return (
                <Chip color={activity.metadata?.isOpen ? "success" : "danger"}>
                    {activity.metadata?.isOpen ? "Open" : "Closed"}
                </Chip>
            );
        case "isVisible":
            return (
                <Chip color={activity.metadata?.isVisible ? "success" : "danger"}>
                    {activity.metadata?.isVisible ? "Show" : "Hide"}
                </Chip>
            );
        case "isProgressCount":
            return (
                <Chip color={activity.metadata?.isProgressCount ? "success" : "danger"}>
                    {activity.metadata?.isProgressCount ? "Count" : "Not Count"}
                </Chip>
            );

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
                            key="view detail"
                            startContent={<Eye size={16} />}
                            onPress={() => onViewDetail(activity)}
                        >
                            View Details
                        </DropdownItem>
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
                </Dropdown >
            );
        default:
            return <span>-</span>;
    }
}
