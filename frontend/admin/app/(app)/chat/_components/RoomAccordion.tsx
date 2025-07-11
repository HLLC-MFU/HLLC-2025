"use client";

import { Accordion, AccordionItem, Button, Input, Spinner, Pagination } from "@heroui/react";
import { PlusIcon, SearchIcon, MessageSquare, Lock, Building2, GraduationCap, ChevronDown } from "lucide-react";
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
    
    const roomCategories = [
        { label: "Normal", type: RoomType.NORMAL, icon: <MessageSquare /> },
        { label: "Readonly", type: RoomType.READONLY, icon: <Lock /> },
        { label: "School", type: "school", icon: <Building2 /> },
        { label: "Major", type: "major", icon: <GraduationCap /> }
    ];

    // Track page per room type
    const [pages, setPages] = useState<Record<string, number>>({});

    // Fetch rooms for each category on mount or when page changes
    useEffect(() => {
        roomCategories.forEach(({ type }) => {
            const page = pages[type] || 1;
            fetchRoomsByType(type as string, page, 8); // 8 per page (4 rows x 2 cols)
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            metadata: roomResponse.metadata || {}
        }));
    };
    const getLoadingState = (type: string): boolean => loading[type] || false;
    const getErrorState = (type: string): string | null => error[type] || null;
    const getTotalCount = (type: string): number => roomsByType[type]?.meta.total || 0;
    const getPage = (type: string): number => pages[type] || 1;
    const getTotalPages = (type: string): number => roomsByType[type]?.meta.totalPages || 1;

    return (
        <Accordion className="px-0" variant="splitted">
            {roomCategories.map(({ label, type, icon }) => {
                const rooms = getRoomsForType(type as string);
                const isLoading = getLoadingState(type as string);
                const errorMessage = getErrorState(type as string);
                const totalCount = getTotalCount(type as string);
                const page = getPage(type as string);
                const totalPages = getTotalPages(type as string);

                return (
                    <AccordionItem
                        key={label}
                        aria-label={`${label} Rooms`}
                        className="font-medium mb-2"
                        startContent={
                            <div className="p-3 rounded-xl bg-gradient-to-r bg-gray-200 border">
                                <span className="text-gray-500">{icon}</span>
                            </div>
                        }
                        subtitle={
                            <p className="flex">
                                <span className="text-primary ml-1">
                                    {isLoading ? "Loading..." : `${totalCount} rooms`}
                                </span>
                            </p>
                        }
                        title={`${label} Rooms`}
                    >
                        <RoomSection
                            roomType={label}
                            rooms={rooms}
                            isLoading={isLoading}
                            errorMessage={errorMessage}
                            page={page}
                            totalPages={totalPages}
                            onPageChange={newPage => handlePageChange(type as string, newPage)}
                            onAdd={() => onAdd(type as RoomType | "school" | "major")}
                            onDelete={onDelete}
                            onEdit={onEdit}
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
    roomType: string;
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
    roomType, 
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

            {errorMessage && (
                <div className="flex items-center justify-center py-4">
                    <span className="text-danger">{errorMessage}</span>
                </div>
            )}

            {isLoading && rooms.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                    <Spinner size="lg" />
                </div>
            ) : filteredRooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                    <span className="text-default-400">
                        {filterValue ? `No ${roomType.toLowerCase()} rooms found matching "${filterValue}"` : `No ${roomType.toLowerCase()} rooms found`}
                    </span>
                </div> 
            ) : (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
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
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-4">
                            <Pagination
                                isCompact
                                showControls
                                showShadow
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
