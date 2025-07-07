"use client";

import { Accordion, AccordionItem, Button, Input } from "@heroui/react";
import { PlusIcon, SearchIcon, MessageSquare, Lock, Building2, GraduationCap } from "lucide-react";
import { useState, useMemo } from "react";

import { RoomCard } from "./RoomCard";

import { Room, RoomType } from "@/types/chat";

type RoomAccordionProps = {
    rooms: Room[];
    onAdd: (type: RoomType | "school" | "major") => void;
    onEdit: (room: Room) => void;
    onDelete: (room: Room) => void;
    onToggleStatus?: (room: Room) => void;
};

export default function RoomAccordion({ rooms, onAdd, onEdit, onDelete, onToggleStatus }: RoomAccordionProps) {
    const roomCategories = [
        { label: "Normal", type: RoomType.NORMAL, icon: <MessageSquare /> },
        { label: "Readonly", type: RoomType.READONLY, icon: <Lock /> },
        { label: "School", type: "school", icon: <Building2 /> },
        { label: "Major", type: "major", icon: <GraduationCap /> }
    ];

    const filterRooms = (type: RoomType | string) => rooms.filter(room =>
        type === RoomType.NORMAL || type === RoomType.READONLY
            ? room.type === type && !room.metadata?.groupType
            : room.metadata?.groupType === type
    );

    return (
        <Accordion selectionMode="multiple" variant="splitted">
            {roomCategories.map(({ label, type, icon }) => (
                <AccordionItem key={label} aria-label={`${label} Rooms`} startContent={icon} title={`${label} Rooms`}>
                    <RoomSection
                        roomType={label}
                        rooms={filterRooms(type)}
                        onAdd={() => onAdd(type as RoomType | "school" | "major")}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        onToggleStatus={onToggleStatus}
                    />
                </AccordionItem>
            ))}
        </Accordion>
    );
}

type RoomSectionProps = {
    rooms: Room[];
    roomType: string;
    onAdd: () => void;
    onEdit: (room: Room) => void;
    onDelete: (room: Room) => void;
    onToggleStatus?: (room: Room) => void;
};

const RoomSection = ({ rooms, roomType, onAdd, onEdit, onDelete, onToggleStatus }: RoomSectionProps) => {
    const [filterValue, setFilterValue] = useState("");
    const filteredRooms = useMemo(
        () =>
            rooms.filter(
                (room) =>
                    room.name.en.toLowerCase().includes(filterValue.toLowerCase()) ||
                    room.name.th.toLowerCase().includes(filterValue.toLowerCase())
            ),
        [rooms, filterValue]
    );

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between gap-3 items-end">
                <Input
                    isClearable
                    className="w-full sm:max-w-[44%]"
                    placeholder={`Search ${roomType.toLowerCase()} rooms`}
                    startContent={<SearchIcon />}
                    value={filterValue}
                    onClear={() => setFilterValue('')}
                    onValueChange={setFilterValue}
                />
                <Button color="primary" endContent={<PlusIcon size={20} />} onPress={onAdd}>
                    Add {roomType} Room
                </Button>
            </div>

            {filteredRooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                    <span className="text-default-400">
                        {filterValue ? `No ${roomType.toLowerCase()} rooms found matching "${filterValue}"` : `No ${roomType.toLowerCase()} rooms found`}
                    </span>
                </div> 
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredRooms.map((room) => (
                        <RoomCard
                            key={room._id}
                            room={room}
                            onDelete={() => onDelete(room)}
                            onEdit={() => onEdit(room)}
                            onToggleStatus={onToggleStatus ? () => onToggleStatus(room) : undefined}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
