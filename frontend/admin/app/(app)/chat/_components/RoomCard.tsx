"use client";

import { Room } from "@/types/chat";
import { Card, CardBody, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { Building2, EllipsisVertical, Eye, Pencil, Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface RoomCardProps {
    room: Room;
    onEdit: (room: Room) => void;
    onDelete: (room: Room) => void;
}

export function RoomCard({ room, onEdit, onDelete }: RoomCardProps) {
    const router = useRouter();

    const handleViewDetails = () => {
        router.push(`/chat/rooms/${room._id}`);
    };

    const handleEdit = () => {
        onEdit(room);
    };

    const handleDelete = () => {
        onDelete(room);
    };

    return (
        <div onClick={handleViewDetails} className="hover:cursor-pointer">
            <Card isHoverable className="h-full">
                <CardBody className="p-3">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-7 h-7 bg-primary text-white text-xs items-center justify-center flex-shrink-0 rounded-md flex">
                                {room.name.en.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                                <p className="text-sm font-semibold truncate">
                                    {room.name.en}
                                </p>
                                <p className="text-xs text-default-500 truncate">
                                    {room.name.th}
                                </p>
                            </div>
                        </div>
                        <Dropdown>
                            <DropdownTrigger>
                                <Button
                                    variant="light"
                                    color="primary"
                                    isIconOnly
                                    size="sm"
                                    className="flex-shrink-0"
                                >
                                    <EllipsisVertical size={12} />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Room Actions">
                                <DropdownItem
                                    key="edit"
                                    startContent={<Pencil size={12} />}
                                    onPress={handleEdit}
                                >
                                    Edit Room
                                </DropdownItem>
                                <DropdownItem
                                    key="delete"
                                    className="text-danger"
                                    color="danger"
                                    startContent={<Trash2 size={12} />}
                                    onPress={handleDelete}
                                >
                                    Delete Room
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 text-xs text-default-500">
                            <div className="flex items-center gap-1">
                                <Building2 size={10} />
                                <span>{room.capacity === 0 ? "∞" : room.capacity}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Users size={10} />
                                <span>{room.memberCount}</span>
                            </div>
                        </div>
                        <Button
                            variant="light"
                            color="primary"
                            size="sm"
                            startContent={<Eye size={10} />}
                            onPress={handleViewDetails}
                            className="text-xs px-2"
                        >
                            View
                        </Button>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}