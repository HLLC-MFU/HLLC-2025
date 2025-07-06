"use client";

import { Room } from "@/types/chat";
import { Card, CardBody, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Image, Badge } from "@heroui/react";
import { Building2, EllipsisVertical, Eye, Pencil, Trash2, Users, Image as ImageIcon, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Chat service API base URL
const CHAT_API_BASE_URL = process.env.GO_PUBLIC_API_URL || "http://localhost:1334/api";

interface RoomCardProps {
    room: Room;
    onEdit: (room: Room) => void;
    onDelete: (room: Room) => void;
    onToggleStatus?: (room: Room) => void;
}

export function RoomCard({ room, onEdit, onDelete, onToggleStatus }: RoomCardProps) {
    const router = useRouter();
    const [imageError, setImageError] = useState(false);

    const handleViewDetails = () => {
        router.push(`/chat/${room._id}`);
    };

    const handleEdit = () => {
        onEdit(room);
    };

    const handleDelete = () => {
        onDelete(room);
    };

    const handleToggleStatus = () => {
        if (onToggleStatus) {
            onToggleStatus(room);
        }
    };

    const handleCardClick = () => {
        router.push(`/chat/${room._id}`);
    };

    const getRoomImage = () => {
        if (room.image && !imageError) {
            return `${CHAT_API_BASE_URL}/uploads/${room.image}`;
        }
        return null;
    };

    const getRoomInitial = () => {
        return room.name.en.charAt(0).toUpperCase();
    };

    return (
        <Card isHoverable className="h-full cursor-pointer group" onPress={handleCardClick}>
            <CardBody className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Room Image/Avatar */}
                        <div className="relative w-12 h-12 flex-shrink-0">
                            {getRoomImage() ? (
                                <Image
                                    src={getRoomImage()!}
                                    alt={room.name.en}
                                    className="w-full h-full object-cover rounded-lg"
                                    onError={() => setImageError(true)}
                                    fallbackSrc={`https://ui-avatars.com/api/?name=${getRoomInitial()}&background=6366f1&color=fff&size=48&font-size=0.4`}
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary to-primary-600 text-white text-lg font-semibold items-center justify-center flex-shrink-0 rounded-lg flex">
                                    {getRoomInitial()}
                                </div>
                            )}
                        </div>
                        
                        {/* Room Info */}
                        <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold truncate text-foreground">
                                    {room.name.en}
                                </p>
                                <Badge 
                                    size="sm" 
                                    variant="flat" 
                                    color={room.status === "active" ? "success" : "danger"}
                                    className="flex-shrink-0"
                                >
                                    {room.status === "active" ? "Active" : "Inactive"}
                                </Badge>
                            </div>
                            <p className="text-xs text-default-500 truncate">
                                {room.name.th}
                            </p>
                        </div>
                    </div>
                    
                    {/* Responsive Dropdown */}
                    <Dropdown placement="bottom-end">
                        <DropdownTrigger>
                            <Button
                                variant="light"
                                color="default"
                                isIconOnly
                                size="sm"
                                className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            >
                                <EllipsisVertical size={16} />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu 
                            aria-label="Room Actions"
                            className="w-48"
                            itemClasses={{
                                base: "gap-3",
                            }}
                        >
                            <DropdownItem
                                key="view"
                                startContent={<Eye size={16} />}
                                onPress={handleViewDetails}
                                className="text-default-500"
                            >
                                View Members
                            </DropdownItem>
                            <DropdownItem
                                key="edit"
                                startContent={<Pencil size={16} />}
                                onPress={handleEdit}
                                className="text-default-500"
                            >
                                Edit Room
                            </DropdownItem>
                            <DropdownItem
                                key="toggle-status"
                                startContent={room.status === "active" ? <XCircle size={16} /> : <CheckCircle size={16} />}
                                onPress={handleToggleStatus}
                                className={room.status === "active" ? "text-warning" : "text-success"}
                            >
                                {room.status === "active" ? "Deactivate" : "Activate"}
                            </DropdownItem>
                            <DropdownItem
                                key="delete"
                                className="text-danger"
                                color="danger"
                                startContent={<Trash2 size={16} />}
                                onPress={handleDelete}
                            >
                                Delete Room
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </div>
                
                {/* Room Stats */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-default-100">
                    <div className="flex items-center gap-3 text-xs text-default-500">
                        <div className="flex items-center gap-1">
                            <Building2 size={12} />
                            <span className="font-medium">{room.capacity === 0 ? "∞" : room.capacity}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Users size={12} />
                            <span className="font-medium">{room.memberCount || 0}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="flat"
                            color={room.status === "active" ? "warning" : "success"}
                            size="sm"
                            isIconOnly
                            onPress={handleToggleStatus}
                            className="text-xs h-6 w-6"
                        >
                            {room.status === "active" ? <XCircle size={12} /> : <CheckCircle size={12} />}
                        </Button>
                        <Button
                            variant="flat"
                            color="primary"
                            size="sm"
                            startContent={<Eye size={12} />}
                            onPress={handleViewDetails}
                            className="text-xs px-3 h-6"
                        >
                            View
                        </Button>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}