import { Activities } from "@/types/activities";
import { Card, CardBody, CardHeader, CardFooter, Button, Divider, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { Building2, Calendar, EllipsisVertical, Eye, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface ActivityCardProps {
    activity: Activities;
    onEdit: (activity: Activities) => void;
    onDelete: (activity: Activities) => void;
}

export function ActivityCard({ activity, onEdit, onDelete }: ActivityCardProps) {
    const router = useRouter();

    const handleViewDetails = () => {
        router.push(`/activities/${activity._id}`);
    };

    return (
        <div onClick={handleViewDetails} className="hover:cursor-pointer">        
        <Card isHoverable className="h-full">
            <CardHeader className="flex gap-3 p-4">
                <Card
                    radius="md"
                    className="w-12 h-12 text-large items-center justify-center flex-shrink-0"
                >
                    {activity.shortName.en.substring(0, 3).toUpperCase()}
                </Card>
                <div className="flex flex-col items-start min-w-0 text-start">
                    <p className="text-lg font-semibold truncate w-full">{activity.fullName.en}</p>
                    <p className="text-small text-default-500 truncate w-full">{activity.fullName.th}</p>
                </div>
            </CardHeader>
            <Divider />
            <CardBody className="gap-4 p-4">
                <div className="flex items-center gap-2">
                    <Building2 className="text-default-500 flex-shrink-0" size={16} />
                    <span className="text-sm text-default-500 truncate">{activity.shortName.en}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className="text-default-500 flex-shrink-0" size={16} />
                    <span className="text-sm text-default-500">{activity.location}</span>
                </div>
                <p className="text-sm text-default-500 line-clamp-2">
                    {activity.shortDetails.en}
                </p>
            </CardBody>
            <Divider />
            <CardFooter className="flex justify-between p-4">
                <Button
                    variant="light"
                    color="primary"
                    size="sm"
                    startContent={<Eye size={16} />}
                    onPress={handleViewDetails}
                    className="flex-1 sm:flex-none"
                >
                    View Details
                </Button>
                <Dropdown>
                    <DropdownTrigger>
                        <Button
                            variant="light"
                            color="primary"
                            isIconOnly
                            size="sm"
                            className="flex-shrink-0"
                        >
                            <EllipsisVertical size={16} />
                        </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Activity Actions">
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
            </CardFooter>
        </Card>
        </div>
    );
}