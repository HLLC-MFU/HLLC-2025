"use client";

import { Room, RoomType } from "@/types/chat";
import { Accordion, AccordionItem, Button, Input } from "@heroui/react";
import { PlusIcon, SearchIcon, MessageSquare, Lock, Building2, GraduationCap } from "lucide-react";
import { useState, useMemo } from "react";
import { RoomCard } from "./RoomCard";

interface RoomAccordionProps {
    rooms: Room[];
    onAdd: (type: RoomType | "school" | "major") => void;
    onEdit: (room: Room) => void;
    onDelete: (room: Room) => void;
}

export default function RoomAccordion({ 
    rooms, 
    onAdd,
    onEdit, 
    onDelete 
}: RoomAccordionProps) {
    // Group rooms by type & groupType
    const normalRooms = rooms.filter((room) => room.type === RoomType.NORMAL);
    const readonlyRooms = rooms.filter((room) => room.type === RoomType.READONLY);
    const schoolRooms = rooms.filter((room) => room.metadata?.groupType === "school");
    const majorRooms = rooms.filter((room) => room.metadata?.groupType === "major");

    return (
        <Accordion variant="splitted" selectionMode="multiple">
            {/* Normal Rooms Accordion */}
            <AccordionItem 
                key="normal" 
                aria-label="Normal Rooms" 
                title="Normal Rooms"
                startContent={<MessageSquare />}
            >
                <RoomSection
                    rooms={normalRooms}
                    roomType="Normal"
                    onAdd={() => onAdd(RoomType.NORMAL)}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            </AccordionItem>

            {/* Readonly Rooms Accordion */}
            <AccordionItem 
                key="readonly" 
                aria-label="Readonly Rooms" 
                title="Readonly Rooms"
                startContent={<Lock />}
            >
                <RoomSection
                    rooms={readonlyRooms}
                    roomType="Readonly"
                    onAdd={() => onAdd(RoomType.READONLY)}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            </AccordionItem>

            {/* School Rooms Accordion */}
            <AccordionItem 
                key="school" 
                aria-label="School Rooms" 
                title="School Rooms"
                startContent={<Building2 />}
            >
                <RoomSection
                    rooms={schoolRooms}
                    roomType="School"
                    onAdd={() => onAdd("school")}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            </AccordionItem>

            {/* Major Rooms Accordion */}
            <AccordionItem 
                key="major" 
                aria-label="Major Rooms" 
                title="Major Rooms"
                startContent={<GraduationCap />}
            >
                <RoomSection
                    rooms={majorRooms}
                    roomType="Major"
                    onAdd={() => onAdd("major")}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            </AccordionItem>
        </Accordion>
    );
}

interface RoomSectionProps {
    rooms: Room[];
    roomType: string;
    onAdd: () => void;
    onEdit: (room: Room) => void;
    onDelete: (room: Room) => void;
}

function RoomSection({ 
    rooms, 
    roomType, 
    onAdd, 
    onEdit, 
    onDelete 
}: RoomSectionProps) {
    const [filterValue, setFilterValue] = useState("");

    const filteredRooms = useMemo(() => {
        const query = filterValue.toLowerCase();
        return rooms.filter((room) =>
            room.name.en.toLowerCase().includes(query) ||
            room.name.th.toLowerCase().includes(query)
        );
    }, [rooms, filterValue]);

    const handleClear = () => {
        setFilterValue("");
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Top Content with Search and Add Button */}
            <div className="flex justify-between gap-3 items-end">
                <Input
                    isClearable
                    className="w-full sm:max-w-[44%]"
                    placeholder={`Search ${roomType.toLowerCase()} rooms`}
                    startContent={<SearchIcon />}
                    value={filterValue}
                    onClear={handleClear}
                    onValueChange={setFilterValue}
                />
                <Button 
                    onPress={onAdd} 
                    color="primary" 
                    endContent={<PlusIcon size={20} />}
                >
                    Add {roomType} Room
                </Button>
            </div>

            {/* Rooms Grid */}
            {filteredRooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                    <span className="text-default-400">
                        {filterValue 
                            ? `No ${roomType.toLowerCase()} rooms found matching "${filterValue}"` 
                            : `No ${roomType.toLowerCase()} rooms found`
                        }
                    </span>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredRooms.map((room) => (
                        <RoomCard
                            key={room._id}
                            room={room}
                            onEdit={() => onEdit(room)}
                            onDelete={() => onDelete(room)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}