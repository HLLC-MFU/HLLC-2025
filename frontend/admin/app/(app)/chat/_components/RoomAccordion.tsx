"use client";

import { Accordion, AccordionItem, Button, Input, Spinner, Pagination } from "@heroui/react";
import { PlusIcon, SearchIcon, MessageSquare, Lock, Building2, GraduationCap, MicVocal } from "lucide-react";
import { useState, useMemo } from "react";
import { RoomCard } from "./RoomCard";
 import { RoomSkeleton } from "./RoomSkeleton";
import type { Room, RoomType } from "@/types/room";

type RoomAccordionProps = {
    rooms: Room[];
    loading: boolean;
    error: string | null;
    onAdd: (type: RoomType | "school" | "major") => void;
    onEdit: (room: Room) => void;
    onDelete: (room: Room) => void;
    onToggleStatus?: (room: Room) => void;
    openAccordion?: string | null;
    setOpenAccordion?: (key: string | null) => void;
};

export default function RoomAccordion({ 
    rooms, 
    loading, 
    error, 
    onAdd, 
    onEdit, 
    onDelete, 
    onToggleStatus,
    openAccordion,
    setOpenAccordion
}: RoomAccordionProps) {
    
    const roomCategories = [
        { label: "Normal", type: "normal" as RoomType, icon: <MessageSquare size={18} /> },
        { label: "Readonly", type: "readonly" as RoomType, icon: <Lock size={18} /> },
        { label: "Master of Ceremonies", type: "mc" as RoomType, icon: <MicVocal size={18} /> },
        { label: "School", type: "school", icon: <Building2 size={18} /> },
        { label: "Major", type: "major", icon: <GraduationCap size={18} /> }
    ];

    // Filter rooms by type
    const getRoomsForType = (type: string): Room[] => {
        if (!rooms.length) return [];
        return rooms.filter(room => {
            if (type === "school") {
                return room.metadata?.groupType === "school";
            }
            if (type === "major") {
                return room.metadata?.groupType === "major";
            }
            // เฉพาะ normal/readonly ที่ไม่มี groupType เท่านั้น
            return room.type === type && !room.metadata?.groupType;
        });
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <RoomSkeleton key={i} />
                ))}
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
        <Accordion 
            className="p-0" 
            variant="splitted"
            selectedKeys={openAccordion ? [openAccordion] : []}
            onSelectionChange={(keys) => {
                if (setOpenAccordion) {
                    const arr = Array.from(keys as Set<string>);
                    setOpenAccordion(arr[0] || null);
                }
            }}
        >
            {roomCategories.map(({ label, type, icon }) => {
                const rooms = getRoomsForType(type as string);
                const totalCount = rooms.length;

                return (
                    <AccordionItem
                        key={type}
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
                            base: "border border-gray-100"
                        }}
                    >
                        <RoomSection
                            type={type}
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
    type,
    rooms, 
    onAdd, 
    onEdit, 
    onDelete, 
    onToggleStatus
}: RoomSectionProps & { type: string }) => {
    const [filterValue, setFilterValue] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4; // Show fewer items to make pagination more visible
    
    const filteredRooms = useMemo(() => {
        if (!filterValue) return rooms;
        return rooms.filter(room =>
            room.name.en.toLowerCase().includes(filterValue.toLowerCase()) ||
            room.name.th.toLowerCase().includes(filterValue.toLowerCase())
        );
    }, [rooms, filterValue]);

    // Calculate pagination
    const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentRooms = filteredRooms.slice(startIndex, endIndex);

    // Reset to page 1 when filter changes
    useMemo(() => {
        setCurrentPage(1);
    }, [filterValue]);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:items-end">
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
                    endContent={<PlusIcon size={18} className="sm:w-5 sm:h-5" />} 
                    onPress={onAdd}
                    className={`w-full sm:w-auto flex-shrink-0 ${
                        type === 'normal' ? "bg-primary hover:bg-primary/90 text-white font-medium" :
                        type === 'readonly' ? "bg-blue-600 hover:bg-blue-700 text-white font-medium" :
                        type === 'school' ? "bg-green-600 hover:bg-green-700 text-white font-medium" :
                        type === 'major' ? "bg-yellow-500 hover:bg-yellow-600 text-white font-medium" :
                        "bg-primary text-white font-medium"
                    }`}
                >
                    <span className="hidden sm:inline">
                        {type === 'normal' && 'Add Normal Room'}
                        {type === 'readonly' && 'Add Readonly Room'}
                        {type === 'mc' && 'Add Master of Ceremonies Room'}
                        {type === 'school' && 'Add School Room'}
                        {type === 'major' && 'Add Major Room'}
                    </span>
                    <span className="sm:hidden">
                        {type === 'normal' && 'Add Normal'}
                        {type === 'readonly' && 'Add Readonly'}
                        {type === 'mc' && 'Add Master of Ceremonies'}
                        {type === 'school' && 'Add School'}
                        {type === 'major' && 'Add Major'}
                    </span>
                </Button>
            </div>

            {filteredRooms.length === 0 ? (
                <div className="text-center py-8">
                    <span className="text-gray-400">
                        {filterValue ? `No rooms found matching "${filterValue}"` : "No rooms found"}
                    </span>
                </div> 
            ) : (
                <>
                    {/* Room Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {currentRooms.map((room) => (
                            <RoomCard
                                key={room._id}
                                room={room}
                                onDelete={onDelete}
                                onEdit={onEdit}
                                onToggleStatus={onToggleStatus}
                            />
                        ))}
                    </div>

                    {/* Pagination - Always show if more than 1 page OR if we have rooms */}
                    {(totalPages > 1 || filteredRooms.length > 0) && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 bg-gray-50 rounded-lg border">
                            <div className="text-sm text-gray-600 font-medium">
                                {filteredRooms.length > 0 ? (
                                    <>
                                        Showing <span className="text-primary font-semibold">{startIndex + 1}-{Math.min(endIndex, filteredRooms.length)}</span> of <span className="text-primary font-semibold">{filteredRooms.length}</span> rooms
                                        {totalPages > 1 && <span className="text-gray-500 ml-2">(Page {currentPage} of {totalPages})</span>}
                                    </>
                                ) : (
                                    "No rooms to display"
                                )}
                            </div>
                            {totalPages > 1 && (
                                <Pagination
                                    total={totalPages}
                                    page={currentPage}
                                    onChange={setCurrentPage}
                                    showControls
                                    showShadow
                                    color="primary"
                                    size="sm"
                                    classNames={{
                                        wrapper: "gap-1 overflow-visible h-8",
                                        item: "w-8 h-8 text-small bg-white border border-gray-200 hover:bg-gray-50",
                                        cursor: "bg-primary text-white font-medium border-primary"
                                    }}
                                />
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
