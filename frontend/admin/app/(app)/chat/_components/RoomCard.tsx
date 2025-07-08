"use client";

import { 
    Card, 
    CardBody, 
    Button, 
    Dropdown, 
    DropdownTrigger, 
    DropdownMenu, 
    DropdownItem, 
    Image 
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

    const handleAction = (action: string) => {
        if (action === "view") router.push(`/chat/${room._id}`);
        if (action === "edit") onEdit(room);
        if (action === "delete") onDelete(room);
        if (action === "toggle") onToggleStatus?.(room);
    };

    const roomImage = room.image && !imageError 
        ? `${process.env.NEXT_PUBLIC_GO_API_URL}/uploads/${room.image}` 
        : `https://ui-avatars.com/api/?name=${room.name.en.charAt(0).toUpperCase()}&background=6366f1&color=fff&size=48&font-size=0.4`;

    return (
        <Card 
            isHoverable 
            className="h-full cursor-pointer group" 
            onPress={() => router.push(`/chat/${room._id}`)}
        >
            <CardBody className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative w-12 h-12 flex-shrink-0">
                            <Image
                                alt={room.name.en}
                                className="w-full h-full object-cover rounded-lg"
                                src={roomImage}
                                onError={() => setImageError(true)}
                            />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold truncate text-foreground">{room.name.en}</p>
                                <span 
                                    className={`w-2 h-2 rounded-full ${room.status === "active" ? "bg-green-500" : "bg-red-500"} inline-block`} 
                                    title={room.status === "active" ? "Active" : "Inactive"}
                                 />
                            </div>
                            <p className="text-xs text-default-500 truncate">{room.name.th}</p>
                        </div>
                    </div>

                    <Dropdown placement="bottom-end">
                        <DropdownTrigger>
                            <Button 
                                isIconOnly 
                                className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
                                color="default" 
                                size="sm" 
                                variant="light"
                            >
                                <EllipsisVertical size={16} />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Room Actions" className="w-48">
                            {["view", "edit", "toggle", "delete"].map(action => (
                                <DropdownItem 
                                    key={action} 
                                    className={action === "toggle" 
                                        ? (room.status === "active" ? "text-warning" : "text-success") 
                                        : action === "delete" 
                                        ? "text-danger" 
                                        : "text-default-500"
                                    }
                                    startContent={
                                        action === "view" 
                                            ? <Eye size={16} /> 
                                            : action === "edit" 
                                            ? <Pencil size={16} /> 
                                            : action === "toggle" 
                                            ? (room.status === "active" ? <XCircle size={16} /> : <CheckCircle size={16} />) 
                                            : <Trash2 size={16} />
                                    }
                                    onPress={() => handleAction(action)}
                                >
                                    {action === "view" 
                                        ? "View Members" 
                                        : action === "edit" 
                                        ? "Edit Room" 
                                        : action === "toggle" 
                                        ? (room.status === "active" ? "Deactivate" : "Activate") 
                                        : "Delete Room"
                                    }
                                </DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-default-100">
                    <div className="flex items-center gap-3 text-xs text-default-500">
                        <div className="flex items-center gap-1">
                            <Building2 size={12} />
                            <span className="font-medium">{room.capacity === 0 ? "\u221e" : room.capacity}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Users size={12} />
                            <span className="font-medium">{room.memberCount || 0}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button 
                            isIconOnly 
                            className="text-xs h-6 w-6" 
                            color={room.status === "active" ? "success" : "danger"} 
                            size="sm" 
                            variant="flat" 
                            onPress={() => handleAction("toggle")}
                        >
                            {room.status === "active" ? <XCircle size={12} /> : <CheckCircle size={12} />}
                        </Button>
                        <Button 
                            className="text-xs px-3 h-6" 
                            color="primary" 
                            size="sm" 
                            startContent={<Eye size={12} />} 
                            variant="flat" 
                            onPress={() => handleAction("view")}
                        >
                            View
                        </Button>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}
