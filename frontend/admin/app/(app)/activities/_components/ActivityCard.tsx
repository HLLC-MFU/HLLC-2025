import { Activities } from "@/types/activities";
import { Card, CardBody, CardHeader, CardFooter, Button, Divider, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Chip } from "@heroui/react";
import { Building2, Calendar, EllipsisVertical, Eye, Pencil, Trash2, MapPin, Users, Clock } from "lucide-react";
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

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <Card className="w-full">
            <div className="relative w-full pt-[56.25%]">
                <img
                    src={activity.photo?.bannerPhoto 
                        ? `http://localhost:8080/uploads/${activity.photo.bannerPhoto}`
                        : "http://localhost:8080/uploads/default-banner.jpg"}
                    alt={activity.name.en}
                    className="absolute top-0 left-0 w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4">
                    <Chip 
                        size="sm" 
                        color={activity.metadata?.isOpen ? "success" : "danger"}
                        variant="solid"
                        className="text-white"
                    >
                        {activity.metadata?.isOpen ? "Open" : "Closed"}
                    </Chip>
                </div>
            </div>

            <CardHeader className="flex gap-3">
                <div className="flex flex-col items-start min-w-0">
                    <p className="text-lg font-semibold truncate w-full">{activity.name.en}</p>
                    <p className="text-small text-default-500 truncate w-full">{activity.name.th}</p>
                </div>
            </CardHeader>

            <Divider/>

            <CardBody className="gap-4">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <Building2 className="text-default-500 flex-shrink-0" size={16} />
                        <span className="text-sm text-default-500 truncate">{activity.acronym}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="text-default-500 flex-shrink-0" size={16} />
                        <span className="text-sm text-default-500 truncate">{activity.location.en || 'No location'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users className="text-default-500 flex-shrink-0" size={16} />
                        <span className="text-sm text-default-500">
                            {activity.metadata?.scope?.user?.length || 0} Participants
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="text-default-500 flex-shrink-0" size={16} />
                        <span className="text-sm text-default-500">
                            Created: {formatDate(activity.createdAt)}
                        </span>
                    </div>
                    <div className="mt-2">
                        <p className="text-sm text-default-500 line-clamp-3">
                            {activity.shortDetails.en || 'No description available'}
                        </p>
                    </div>
                </div>
            </CardBody>

            <Divider/>

            <CardFooter className="justify-between">
                <Button
                    variant="flat"
                    color="primary"
                    size="sm"
                    startContent={<Eye size={16} />}
                    onPress={handleViewDetails}
                >
                    View Details
                </Button>
                <Dropdown>
                    <DropdownTrigger>
                        <Button
                            variant="light"
                            isIconOnly
                            size="sm"
                        >
                            <EllipsisVertical size={16} />
                        </Button>
                    </DropdownTrigger>
                    <DropdownMenu>
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
    );
}