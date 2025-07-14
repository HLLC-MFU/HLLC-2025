import { RoomSkeleton } from "./RoomSkeleton";
import { RoomCard } from "./RoomCard";

import { Room } from "@/types/chat";

type RoomListProps = {
    rooms?: Room[];
    isLoading: boolean;
    onEditRoom: (room: Room) => void;
    onDeleteRoom: (room: Room) => void;
};

export function RoomList({ 
    rooms, 
    isLoading, 
    onEditRoom, 
    onDeleteRoom 
}: RoomListProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <RoomSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (!rooms || rooms.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8">
                <span className="text-default-400">No rooms found</span>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rooms.map((room) => (
                <RoomCard 
                    key={room._id} 
                    room={room} 
                    onDelete={onDeleteRoom} 
                    onEdit={onEditRoom} 
                />
            ))}
        </div>
    );
}