import { Activities } from "@/types/activities";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tooltip, Chip } from "@heroui/react";
import { EllipsisVertical, Eye, Pencil, Trash2, Globe2, CheckCircle2, XCircle, Image as ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface ActivityTableProps {
    activities: Activities[];
    onEdit: (activity: Activities) => void;
    onDelete: (activity: Activities) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const defaultBanner = `${API_URL}/uploads/default-banner.jpg`;
const defaultLogo = `${API_URL}/uploads/default-logo.jpg`;

const columns = [
    { name: "IMAGES", uid: "images" },
    { name: "ACTIVITY INFO", uid: "info" },
    { name: "DETAILS", uid: "details" },
    { name: "STATUS", uid: "status" },
    { name: "ACTIONS", uid: "actions" }
];

export function ActivityTable({ activities, onEdit, onDelete }: ActivityTableProps) {
    const router = useRouter();

    const getImageUrl = (path: string | undefined, isLogo = false) => {
        if (!path) return isLogo ? defaultLogo : defaultBanner;
        if (path.startsWith("http://") || path.startsWith("https://")) {
            return path;
        }
        return `${API_URL}/${path.startsWith("/") ? path.slice(1) : path}`;
    };

    const renderCell = (activity: Activities, columnKey: React.Key) => {
        switch (columnKey) {
            case "images":
                return (
                    <div className="flex flex-col gap-2">
                        {/* Banner Image */}
                        <div className="relative w-40 h-24 rounded-lg overflow-hidden bg-default-100">
                            <div className="relative w-full h-full">
                                <img
                                    src={getImageUrl(activity.photo?.bannerPhoto)}
                                    alt="Banner"
                                    className="object-cover w-full h-full"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        if (!target.src.includes('default-banner.jpg')) {
                                            target.src = defaultBanner;
                                        } else {
                                            target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='9' cy='9' r='2'%3E%3C/circle%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'%3E%3C/path%3E%3C/svg%3E";
                                        }
                                    }}
                                />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 px-2 py-1 text-xs bg-black/50 text-white">
                                Banner
                            </div>
                        </div>
                        
                        {/* Logo Image */}
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-default-100 mx-auto">
                            <div className="relative w-full h-full">
                                <img
                                    src={getImageUrl(activity.photo?.bannerPhoto)}
                                    alt="Logo"
                                    className="object-cover w-full h-full"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        if (!target.src.includes('default-logo.jpg')) {
                                            target.src = defaultLogo;
                                        } else {
                                            target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='9' cy='9' r='2'%3E%3C/circle%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'%3E%3C/path%3E%3C/svg%3E";
                                        }
                                    }}
                                />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 px-2 py-1 text-xs bg-black/50 text-white text-center">
                                Logo
                            </div>
                        </div>
                    </div>
                );
            case "info":
                return (
                    <div className="flex flex-col gap-3">
                        {/* Name and Acronym */}
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-lg">{activity.acronym}</span>
                                <Globe2 size={14} className="text-default-400" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium">{activity.name?.en || "Unnamed"}</p>
                                <p className="text-xs text-default-400">{activity.name?.th || "ไม่มีชื่อ"}</p>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-default-400">Location:</span>
                            <p className="text-sm">{activity.location?.en || "No location"}</p>
                            <p className="text-xs text-default-400">{activity.location?.th || "ไม่ระบุสถานที่"}</p>
                        </div>
                    </div>
                );
            case "details":
                return (
                    <div className="flex flex-col gap-3 max-w-[300px]">
                        {/* Short Details */}
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-default-400">Short Details:</span>
                            <p className="text-sm line-clamp-2">{activity.shortDetails?.en || "No short details"}</p>
                            <p className="text-xs text-default-400 line-clamp-1">{activity.shortDetails?.th || "ไม่มีรายละเอียดย่อ"}</p>
                        </div>

                        {/* Full Details */}
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-default-400">Full Details:</span>
                            <Tooltip 
                                content={
                                    <div className="max-w-[400px] p-2">
                                        <p className="mb-2">{activity.fullDetails?.en || "No full details"}</p>
                                        <p className="text-sm">{activity.fullDetails?.th || "ไม่มีรายละเอียดเต็ม"}</p>
                                    </div>
                                }
                            >
                                <p className="text-sm line-clamp-2 cursor-help">{activity.fullDetails?.en || "No full details"}</p>
                            </Tooltip>
                        </div>
                    </div>
                );
            case "status":
                return (
                    <div className="flex flex-col gap-3">
                        {/* Registration Status */}
                        <div className="flex items-center gap-2">
                            {activity.metadata?.isOpen ? (
                                <CheckCircle2 size={16} className="text-success" />
                            ) : (
                                <XCircle size={16} className="text-danger" />
                            )}
                            <span className="text-sm">
                                {activity.metadata?.isOpen ? "Open for Registration" : "Closed"}
                            </span>
                        </div>

                        {/* Status Chips */}
                        <div className="flex flex-wrap gap-2">
                            <Chip
                                size="sm"
                                variant="flat"
                                color={activity.metadata?.isVisible ? "success" : "danger"}
                            >
                                {activity.metadata?.isVisible ? "Visible" : "Hidden"}
                            </Chip>
                            {activity.metadata?.isProgressCount && (
                                <Chip size="sm" variant="flat" color="primary">
                                    Progress Tracking
                                </Chip>
                            )}
                        </div>

                        {/* Scope Info */}
                        <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-default-400">Available for:</span>
                            <div className="flex flex-wrap gap-1">
                                {activity.metadata?.scope?.school?.length > 0 && (
                                    <Chip size="sm" variant="flat">
                                        {activity.metadata.scope.school.length} Schools
                                    </Chip>
                                )}
                                {activity.metadata?.scope?.major?.length > 0 && (
                                    <Chip size="sm" variant="flat">
                                        {activity.metadata.scope.major.length} Majors
                                    </Chip>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case "actions":
                return (
                    <div className="relative flex items-center gap-2">
                        <Dropdown>
                            <DropdownTrigger>
                                <Button isIconOnly size="sm" variant="light">
                                    <EllipsisVertical className="text-default-300" />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu>
                                <DropdownItem
                                    key="view"
                                    startContent={<Eye size={16} />}
                                    onPress={() => router.push(`/activities/${activity._id}`)}
                                >
                                    View Details
                                </DropdownItem>
                                <DropdownItem
                                    key="edit"
                                    startContent={<Pencil size={16} />}
                                    onPress={() => onEdit(activity)}
                                >
                                    Edit Activity
                                </DropdownItem>
                                <DropdownItem
                                    key="delete"
                                    className="text-danger"
                                    color="danger"
                                    startContent={<Trash2 size={16} />}
                                    onPress={() => onDelete(activity)}
                                >
                                    Delete Activity
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Table
            aria-label="Activities table"
            classNames={{
                wrapper: "min-h-[222px]",
                th: "bg-default-100",
                td: "py-4"
            }}
            removeWrapper
        >
            <TableHeader columns={columns}>
                {(column) => (
                    <TableColumn
                        key={column.uid}
                        align={column.uid === "actions" ? "center" : "start"}
                    >
                        {column.name}
                    </TableColumn>
                )}
            </TableHeader>
            <TableBody items={activities} emptyContent="No activities found">
                {(activity) => (
                    <TableRow key={activity._id}>
                        {(columnKey) => <TableCell>{renderCell(activity, columnKey)}</TableCell>}
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
} 