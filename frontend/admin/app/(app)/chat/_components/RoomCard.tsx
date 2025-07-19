"use client";

import { 
    Card, 
    CardBody, 
    Button, 
    Dropdown, 
    DropdownTrigger, 
    DropdownMenu, 
    DropdownItem, 
    Image,
    Switch,
    Chip,
    Divider
} from "@heroui/react";
import { 
    Building2, 
    EllipsisVertical, 
    Eye, 
    Pencil, 
    Trash2, 
    Users, 
    CheckCircle, 
    XCircle,
    CalendarClock
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Room } from "@/types/room";

type RoomCardProps = {
    room: Room;
    onEdit: (room: Room) => void;
    onDelete: (room: Room) => void;
    onToggleStatus?: (room: Room) => void;
};

/**
 * RoomCard Component
 * Displays individual room information with action buttons
 */
export function RoomCard({ room, onEdit, onDelete, onToggleStatus }: RoomCardProps) {
    const router = useRouter();
    const [imageError, setImageError] = useState(false);
    const [isToggling, setIsToggling] = useState(false);

    /**
     * Handle room status toggle
     */
    const handleToggleStatus = async () => {
        if (!onToggleStatus || isToggling) return;
        
        setIsToggling(true);
        try {
            await onToggleStatus(room);
        } finally {
            setIsToggling(false);
        }
    };

    /**
     * Generate room image URL with fallback
     */
    const getRoomImageUrl = () => {
        if (room.image && !imageError) {
            return `${process.env.NEXT_PUBLIC_GO_IMAGE_URL}/uploads/${room.image}`;
        }
        return `https://ui-avatars.com/api/?name=${room.name.en.charAt(0).toUpperCase()}&background=6366f1&color=fff&size=56`;
    };

    /**
     * Format date for display
     */
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    /**
     * Format time for display
     */
    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const hasSchedule = room.schedule && (room.schedule.startAt || room.schedule.endAt);

    return (
        <Card className="h-full min-h-[200px]">
            <CardBody className="p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        <Image
                            alt={room.name.en}
                            className="w-14 h-14 object-cover rounded-xl"
                            src={getRoomImageUrl()}
                            onError={() => setImageError(true)}
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-base truncate">{room.name.en}</h3>
                                <div className={`w-2.5 h-2.5 rounded-full ${room.status === "active" ? "bg-green-500" : "bg-red-500"}`} />
                            </div>
                            <p className="text-sm text-gray-500 truncate mb-2">{room.name.th}</p>
                            
                            {hasSchedule && (
                                <Chip 
                                    color="primary" 
                                    size="sm" 
                                    startContent={<CalendarClock className="w-3 h-3" />}
                                    variant="flat"
                                    className="font-medium px-3 py-1"
                                    classNames={{
                                        content: "text-center px-1"
                                    }}
                                >
                                    Scheduled
                                </Chip>
                            )}
                        </div>
                    </div>

                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <EllipsisVertical size={16} />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu>
                            <DropdownItem key="view" startContent={<Eye size={16} />} onPress={() => router.push(`/chat/${room._id}`)}>
                                View
                            </DropdownItem>
                            <DropdownItem key="edit" startContent={<Pencil size={16} />} onPress={() => onEdit(room)}>
                                Edit
                            </DropdownItem>
                            <DropdownItem 
                                key="toggle"
                                startContent={room.status === "active" ? <XCircle size={16} /> : <CheckCircle size={16} />}
                                onPress={handleToggleStatus}
                            >
                                {room.status === "active" ? "Deactivate" : "Activate"}
                            </DropdownItem>
                            <DropdownItem 
                                key="delete"
                                startContent={<Trash2 size={16} />} 
                                className="text-danger"
                                onPress={() => onDelete(room)}
                            >
                                Delete
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </div>

                {/* Schedule Information */}
                {hasSchedule && (
                    <div className="mt-3 px-3 py-2 bg-gray-50 rounded text-xs">
                        {room.schedule?.startAt && room.schedule?.endAt ? (
                            <div className="flex justify-between">
                                <span className="text-gray-600">
                                    <span className="font-medium">Start:</span> {formatDate(room.schedule.startAt)} {formatTime(room.schedule.startAt)}
                                </span>
                                <span className="text-gray-600">
                                    <span className="font-medium">End:</span> {formatDate(room.schedule.endAt)} {formatTime(room.schedule.endAt)}
                                </span>
                            </div>
                        ) : room.schedule?.startAt ? (
                            <span className="text-gray-600">
                                <span className="font-medium">Start:</span> {formatDate(room.schedule.startAt)} {formatTime(room.schedule.startAt)}
                            </span>
                        ) : room.schedule?.endAt ? (
                            <span className="text-gray-600">
                                <span className="font-medium">End:</span> {formatDate(room.schedule.endAt)} {formatTime(room.schedule.endAt)}
                            </span>
                        ) : null}
                    </div>
                )}

                <Divider className="my-4" />
                
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                            <Building2 size={14} />
                            <span>Capacity: {room.capacity === 0 ? "Unlimited" : room.capacity}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Users size={14} />
                            <span>Members: {room.memberCount || 0}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {onToggleStatus && (
                            <Switch
                                size="sm"
                                isSelected={room.status === "active"}
                                isDisabled={isToggling}
                                onValueChange={handleToggleStatus}
                            />
                        )}
                        <Button 
                            size="sm" 
                            color="primary"
                            variant="flat"
                            startContent={<Eye size={14} />}
                            onPress={() => router.push(`/chat/${room._id}`)}
                        >
                            View
                        </Button>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}
