"use client";

import { Accordion, AccordionItem, Button, Input, Spinner, Pagination } from "@heroui/react";
import { PlusIcon, SearchIcon, MessageSquare, Lock, Building2, GraduationCap } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { RoomCard } from "./RoomCard";
import { Room, RoomType } from "@/types/chat";
import { useRoomsByType } from "@/hooks/useRoomsByType";

type RoomAccordionProps = {
    onAdd: (type: RoomType | "school" | "major") => void;
    onEdit: (room: Room) => void;
    onDelete: (room: Room) => void;
    onToggleStatus?: (room: Room) => void;
};

export default function RoomAccordion({ onAdd, onEdit, onDelete, onToggleStatus }: RoomAccordionProps) {
    const { roomsByType, loading, error, fetchRoomsByType } = useRoomsByType();
    const [pages, setPages] = useState<Record<string, number>>({});

    const roomCategories = [
        { label: "Normal", type: RoomType.NORMAL, icon: <MessageSquare /> },
        { label: "Readonly", type: RoomType.READONLY, icon: <Lock /> },
        { label: "School", type: "school", icon: <Building2 /> },
        { label: "Major", type: "major", icon: <GraduationCap /> }
    ];

    useEffect(() => {
        roomCategories.forEach(({ type }) => {
            const page = pages[type] || 1;
            fetchRoomsByType(type as string, page, 8);
        });
    }, [fetchRoomsByType, pages]);

    const handlePageChange = (type: string, newPage: number) => {
        setPages(prev => ({ ...prev, [type]: newPage }));
    };

    const getRoomsForType = (type: string): Room[] => {
        const roomData = roomsByType[type];
        if (!roomData?.data) return [];
        return roomData.data.map(roomResponse => ({
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
            schedule: roomResponse.schedule // เพิ่ม schedule field
        }));
    };

    return (
        <Accordion variant="splitted">
            {roomCategories.map(({ label, type, icon }) => {
                const rooms = getRoomsForType(type as string);
                const isLoading = loading[type as string] || false;
                const errorMessage = error[type as string] || null;
                const totalCount = roomsByType[type as string]?.meta.total || 0;
                const page = pages[type as string] || 1;
                const totalPages = roomsByType[type as string]?.meta.totalPages || 1;

                return (
                    <AccordionItem
                        key={label}
                        className="mb-2"
                        startContent={
                            <div className="p-3 rounded-xl bg-gray-200">
                                <span className="text-gray-500">{icon}</span>
                            </div>
                        }
                        subtitle={
                            <p className="text-primary ml-1">
                                {isLoading ? "Loading..." : `${totalCount} rooms`}
                            </p>
                        }
                        title={`${label} Rooms`}
                    >
                        <RoomSection
                            rooms={rooms}
                            isLoading={isLoading}
                            errorMessage={errorMessage}
                            page={page}
                            totalPages={totalPages}
                            onPageChange={(newPage) => handlePageChange(type as string, newPage)}
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
    isLoading: boolean;
    errorMessage: string | null;
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onAdd: () => void;
    onEdit: (room: Room) => void;
    onDelete: (room: Room) => void;
    onToggleStatus?: (room: Room) => void;
};

const RoomSection = ({ 
    rooms, 
    isLoading, 
    errorMessage, 
    page,
    totalPages,
    onPageChange,
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
                    startContent={<SearchIcon />}
                    value={filterValue}
                    onClear={() => setFilterValue('')}
                    onValueChange={setFilterValue}
                />
                <Button color="primary" endContent={<PlusIcon size={20} />} onPress={onAdd}>
                    Add Room
                </Button>
            </div>

            {errorMessage && (
                <div className="text-danger text-center py-4">
                    {errorMessage}
                </div>
            )}

            {isLoading && rooms.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                    <Spinner size="lg" />
                </div>
            ) : filteredRooms.length === 0 ? (
                <div className="text-center py-8">
                    <span className="text-gray-400">
                        {filterValue ? `No rooms found matching "${filterValue}"` : "No rooms found"}
                    </span>
                </div> 
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-4">
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
                    
                    {totalPages > 1 && (
                        <div className="flex justify-center mt-4">
                            <Pagination
                                isCompact
                                showControls
                                color="primary"
                                page={page}
                                total={totalPages}
                                onChange={onPageChange}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
