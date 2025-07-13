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
    Clock,
    CalendarClock,
    Timer
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Room } from "@/types/chat";

type RoomCardProps = {
    room: Room;
    onEdit: (room: Room) => void;
    onDelete: (room: Room) => void;
    onToggleStatus?: (room: Room) => void;
};

export function RoomCard({ room, onEdit, onDelete, onToggleStatus }: RoomCardProps) {
    const router = useRouter();
    const [imageError, setImageError] = useState(false);
    const [isToggling, setIsToggling] = useState(false);

    const handleToggleStatus = async () => {
        if (!onToggleStatus || isToggling) return;
        
        setIsToggling(true);
        try {
            await onToggleStatus(room);
        } finally {
            setIsToggling(false);
        }
    };

    const roomImage = room.image && !imageError 
        ? `${process.env.NEXT_PUBLIC_GO_IMAGE_URL}/uploads/${room.image}` 
        : `https://ui-avatars.com/api/?name=${room.name.en.charAt(0).toUpperCase()}&background=6366f1&color=fff&size=56`;

    const dateOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    } as const;
    const timeOptions = {
        hour: "2-digit",
        minute: "2-digit"
    } as const;

    const hasSchedule = room.schedule && (room.schedule.startAt || room.schedule.endAt);

    return (
        <Card className="h-full min-h-[200px]">
            <CardBody className="p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        <Image
                            alt={room.name.en}
                            className="w-14 h-14 object-cover rounded-xl"
                            src={roomImage}
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
                    <>
                        <Divider className="my-4" />
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock size={14} />
                                <span className="font-medium">Schedule Details</span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {room.schedule?.startAt && (
                                    <div className="bg-success-50 p-3 rounded-lg">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Timer size={12} className="text-success-600" />
                                            <span className="text-xs font-medium text-success-600">Start</span>
                                        </div>
                                        <p className="text-sm text-success-900 font-medium">
                                            {new Date(room.schedule.startAt).toLocaleDateString('en-US', dateOptions)}
                                        </p>
                                        <p className="text-sm text-success-700">
                                            {new Date(room.schedule.startAt).toLocaleTimeString('en-US', timeOptions)}
                                        </p>
                                    </div>
                                )}
                                {room.schedule?.endAt && (
                                    <div className="bg-danger-50 p-3 rounded-lg">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Timer size={12} className="text-danger-600" />
                                            <span className="text-xs font-medium text-danger-600">End</span>
                                        </div>
                                        <p className="text-sm text-danger-900 font-medium">
                                            {new Date(room.schedule.endAt).toLocaleDateString('en-US', dateOptions)}
                                        </p>
                                        <p className="text-sm text-danger-700">
                                            {new Date(room.schedule.endAt).toLocaleTimeString('en-US', timeOptions)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
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
