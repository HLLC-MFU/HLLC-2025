import { Room } from "@/types/chat";
import { RoomSkeleton } from "./RoomSkeleton";
import { RoomCard } from "./RoomCard";

interface RoomListProps {
    rooms?: Room[];
    isLoading: boolean;
    onEditRoom: (room: Room) => void;
    onDeleteRoom: (room: Room) => void;
}

export function RoomList({ rooms, isLoading, onEditRoom, onDeleteRoom }: RoomListProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
                <RoomSkeleton key={i} />
            ))}
        </div>
        )
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms?.map((room, index) => (
                <RoomCard 
                key={room._id ?? `room-${index}`} 
                room={room} 
                onEdit={onEditRoom} 
                onDelete={onDeleteRoom} 
/>
))}
        </div>
    );
}