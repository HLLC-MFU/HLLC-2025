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
    XCircle
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



    return (
        <Card className="w-full h-full">
            <CardBody className="p-3 md:p-4 lg:p-5">
                {/* Header Section */}
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Image
                            alt={room.name.en}
                            className="w-10 h-10 md:w-12 md:h-12 object-cover rounded-lg flex-shrink-0"
                            src={getRoomImageUrl()}
                            onError={() => setImageError(true)}
                        />
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm md:text-base truncate mb-1">{room.name.en}</h3>
                            <p className="text-xs md:text-sm text-gray-500 truncate">{room.name.th}</p>
                        </div>
                    </div>

                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light" className="flex-shrink-0">
                                <EllipsisVertical size={14} />
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

                {/* Status Badge */}
                <div className="mb-3">
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        room.status === 'active' 
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                            room.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        {room.status === 'active' ? 'Active' : 'Inactive'}
                    </div>
                </div>

                <Divider className="my-3" />
                
                {/* Stats Section */}
                <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-1 text-xs md:text-sm text-gray-600">
                        <Building2 size={12} />
                        <span className="font-medium">Capacity:</span>
                        <span>{room.capacity === 0 ? "Unlimited" : room.capacity}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs md:text-sm text-gray-600">
                        <Users size={12} />
                        <span className="font-medium">Members:</span>
                        <span>{room.memberCount || 0}</span>
                    </div>
                </div>

                {/* Actions Section */}
                <div className="flex items-center justify-between gap-2">
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
                        startContent={<Eye size={12} />}
                        onPress={() => router.push(`/chat/${room._id}`)}
                        className="flex-1 max-w-[80px]"
                    >
                        View
                    </Button>
                </div>
            </CardBody>
        </Card>
    );
}
