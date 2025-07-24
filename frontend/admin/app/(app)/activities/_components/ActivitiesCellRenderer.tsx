import { Button, Chip, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react";
import { Activities } from "@/types/activities";
import { EllipsisVertical, Eye, Pen, Trash } from "lucide-react";
import { Lang } from "@/types/lang";
import { School } from "@/types/school";
import { Major } from "@/types/major";
import { User } from "@/types/user";

export type ActivitiesColumnKey =
    | "acronym"
    | "name"
    | "location"
    | "startAt"
    | "endAt"
    | "scope"
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
    schools: School[];
    majors: Major[];
    users: User[];
};

export default function ActivitiesCellRenderer({
    activity,
    columnKey,
    onEdit,
    onDelete,
    onViewDetail,
    schools,
    majors,
    users,
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

        case "scope":
            const schoolNames = activity.metadata?.scope?.school?.length
                ? activity.metadata.scope.school
                    .map(s => schools.find(school => school._id === s.toString())?.name.en ?? "N/A")
                    .join(", ")
                : "";

            const majorNames = activity.metadata?.scope?.major?.length
                ? activity.metadata.scope.major
                    .map(m => majors.find(major => major._id === m.toString())?.name.en ?? "N/A")
                    .join(", ")
                : "";

            const userNames = activity.metadata?.scope?.user?.length
                ? activity.metadata.scope.user
                    .map(u => {
                        const user = users.find(user => user._id === u.toString());
                        if (!user) return "N/A";
                        const name = user.name;
                        return [name?.first, name?.middle, name?.last].filter(Boolean).join(" ") || "N/A";
                    })
                    .join(", ")
                : "";

            return (
                <div className="flex flex-col gap-1 text-sm">
                    <div>
                        <span className="font-medium text-default-400">School:</span>{" "}
                        {schoolNames || "N/A"}
                    </div>
                    <div>
                        <span className="font-medium text-default-400">Major:</span>{" "}
                        {majorNames || "N/A"}
                    </div>
                    <div>
                        <span className="font-medium text-default-400">User:</span>{" "}
                        {userNames || "N/A"}
                    </div>
                </div>
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
