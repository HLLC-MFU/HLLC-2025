import { Room } from "@/types/chat";
import { Card, CardBody, CardHeader, CardFooter, Button, Divider, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { Building2, GraduationCap, EllipsisVertical, Eye, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface RoomCardProps {
    room: Room
    onEdit: (room: Room) => void;
    onDelete: (room: Room) => void;
}

export function RoomCard({ room, onEdit, onDelete}: RoomCardProps) {
    const router = useRouter();

    const handleViewDetails = () => {
        router.push(`/chat/rooms/${room._id}`);
    };

    return (
        <div onClick={handleViewDetails} className="hover:cursor-pointer">
            <Card isHoverable className="h-full">
                <CardHeader className="flex gap-3 p-4">
                    <Card 
                    radius="md" 
                    className="w-12 h-12 text-large items-center justify-center flex-shrink-0"
                    >
                        {room.name.en}
                    </Card>
                    <div className="flex flex-col items-start min-w-0 text-start">
                        <p className="text-lg font-semibold truncate w-full">{room.name.en}</p>
                        <p className="text-small text-default-500 truncate w-full">{room.name.th}</p>
                        <p className="text-lg font-semibold truncate w-full">{room.type}</p>
                    </div>
                </CardHeader>
                <Divider />
                <CardBody className="gap-4 p-4">
                    <div className="flex items-center gap-2">
                        <Building2 className="text-default-500 flex-shrink-0" size={16} />
                        <span className="text-sm text-default-500 truncate">{room.capacity}</span>
                    </div>
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
                        <DropdownMenu aria-label="Room Actions">
                            <DropdownItem
                                key="edit"
                                startContent={<Pencil size={16} />}
                                onPress={() => onEdit(room)}
                            >
                                Edit Room
                            </DropdownItem>
                            <DropdownItem
                                key="delete"
                                className="text-danger"
                                color="danger"
                                startContent={<Trash2 size={16} />}
                            >
                                Delete Room
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </CardFooter>
            </Card>
        </div>
    )
}