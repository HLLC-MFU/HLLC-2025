"use client";

import { Accordion, AccordionItem, Button, Input, Spinner } from "@heroui/react";
import { PlusIcon, SearchIcon, MessageSquare, Lock, Building2, GraduationCap } from "lucide-react";
import { useState, useMemo } from "react";
import { RoomCard } from "./RoomCard";
import type { Room, RoomType } from "@/types/room";

type RoomAccordionProps = {
    rooms: Room[];
    loading: boolean;
    error: string | null;
    onAdd: (type: RoomType | "school" | "major") => void;
    onEdit: (room: Room) => void;
    onDelete: (room: Room) => void;
    onToggleStatus?: (room: Room) => void;
};

export default function RoomAccordion({ 
    rooms, 
    loading, 
    error, 
    onAdd, 
    onEdit, 
    onDelete, 
    onToggleStatus 
}: RoomAccordionProps) {
    
    const roomCategories = [
        { label: "Normal", type: "normal" as RoomType, icon: <MessageSquare size={18} /> },
        { label: "Readonly", type: "readonly" as RoomType, icon: <Lock size={18} /> },
        { label: "School", type: "school", icon: <Building2 size={18} /> },
        { label: "Major", type: "major", icon: <GraduationCap size={18} /> }
    ];

    // Filter rooms by type
    const getRoomsForType = (type: string): Room[] => {
        if (!rooms.length) return [];
        
        return rooms
            .filter(roomResponse => {
                if (type === "school") {
                    return roomResponse.metadata?.groupType === "school";
                } else if (type === "major") {
                    return roomResponse.metadata?.groupType === "major";
                } else {
                    return roomResponse.type === type && !roomResponse.metadata?.groupType;
                }
            })
            .map(roomResponse => ({
                _id: roomResponse._id,
                name: roomResponse.name,
                type: roomResponse.type as RoomType,
                status: roomResponse.status,
                capacity: roomResponse.capacity,
                memberCount: roomResponse.memberCount,
                createdBy: roomResponse.createdBy,
                image: roomResponse.image || "",
                createdAt: roomResponse.createdAt || "",
                updatedAt: roomResponse.updatedAt || "",
                metadata: roomResponse.metadata || {},
                schedule: roomResponse.schedule
            }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <span className="text-danger">{error}</span>
            </div>
        );
    }

    return (
        <Accordion className="p-0" variant="splitted">
            {roomCategories.map(({ label, type, icon }) => {
                const rooms = getRoomsForType(type as string);
                const totalCount = rooms.length;

                return (
                    <AccordionItem
                        key={label}
                        aria-label={label}
                        title={<span className="text-gray-800 font-medium">{label} Rooms</span>}
                        subtitle={
                            <p className="flex text-gray-500">
                                Total {label.toLowerCase()} rooms:{' '}
                                <span className="text-gray-700 ml-1 font-medium">{totalCount}</span>
                            </p>
                        }
                        startContent={
                            <div className="p-3 rounded-lg bg-gray-100 border border-gray-200">
                                <span className="text-gray-600">{icon}</span>
                            </div>
                        }
                        classNames={{
                            base: "border border-gray-100",
                            trigger: "hover:bg-gray-50"
                        }}
                    >
                        <RoomSection
                            rooms={rooms}
                            onAdd={() => onAdd(type as RoomType | "school" | "major")}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onToggleStatus={onToggleStatus}
                        />
                    </AccordionItem>
                );
            })}
        </Accordion>
    );
}

type RoomSectionProps = {
    rooms: Room[];
    onAdd: () => void;
    onEdit: (room: Room) => void;
    onDelete: (room: Room) => void;
    onToggleStatus?: (room: Room) => void;
};

const RoomSection = ({ 
    rooms, 
    onAdd, 
    onEdit, 
    onDelete, 
    onToggleStatus
}: RoomSectionProps) => {
    const [filterValue, setFilterValue] = useState("");
    
    const filteredRooms = useMemo(() => {
        if (!filterValue) return rooms;
        return rooms.filter(room =>
            room.name.en.toLowerCase().includes(filterValue.toLowerCase()) ||
            room.name.th.toLowerCase().includes(filterValue.toLowerCase())
        );
    }, [rooms, filterValue]);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between gap-3 items-end">
                <Input
                    isClearable
                    className="w-full sm:max-w-[44%]"
                    placeholder="Search rooms"
                    startContent={<SearchIcon className="text-gray-400" />}
                    value={filterValue}
                    onClear={() => setFilterValue('')}
                    onValueChange={setFilterValue}
                    classNames={{
                        input: "placeholder:text-gray-400",
                        inputWrapper: "border-gray-200 hover:border-gray-300 focus-within:border-gray-400"
                    }}
                />
                <Button 
                    endContent={<PlusIcon size={20} />} 
                    onPress={onAdd}
                    className="bg-primary hover:bg-primary/90 text-white font-medium"
                >
                    Add Room
                </Button>
            </div>

            {filteredRooms.length === 0 ? (
                <div className="text-center py-8">
                    <span className="text-gray-400">
                        {filterValue ? `No rooms found matching "${filterValue}"` : "No rooms found"}
                    </span>
                </div> 
            ) : (
                <div className="grid grid-cols-3 gap-4">
                    {filteredRooms.map((room) => (
                        <RoomCard
                            key={room._id}
                            room={room}
                            onDelete={onDelete}
                            onEdit={onEdit}
                            onToggleStatus={onToggleStatus}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
