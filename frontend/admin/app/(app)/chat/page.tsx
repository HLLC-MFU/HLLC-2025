"use client";

import { addToast } from "@heroui/react";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MessagesSquare, SmilePlus } from "lucide-react";

import RoomAccordion from "./_components/RoomAccordion";
import { RoomModal } from "./_components/RoomModal";
import type { Room, RoomType } from "@/types/room";
import { useChat } from "@/hooks/useChat";
import { PageHeader } from "@/components/ui/page-header";

export default function ChatPage() {
    const { rooms, loading, error, fetchRooms, createRoom, updateRoom, deleteRoom, getRoomMembers: _getRoomMembers } = useChat();
    const getRoomMembers = useCallback(_getRoomMembers, []);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<Room | undefined>();
    const [selectedRoomType, setSelectedRoomType] = useState<RoomType | "school" | "major">("normal");
    const [openAccordion, setOpenAccordion] = useState<string | null>(null);
    const [lastCreatedRoomType, setLastCreatedRoomType] = useState<RoomType | "school" | "major" | null>(null);

    // Helper to get accordion key from room type
    function getAccordionKeyForRoomType(type: RoomType | "school" | "major") {
        return type;
    }

    useEffect(() => {
        // After creating a room, open the corresponding accordion
        if (lastCreatedRoomType) {
            setOpenAccordion(getAccordionKeyForRoomType(lastCreatedRoomType));
            setLastCreatedRoomType(null);
        }
    }, [rooms, lastCreatedRoomType]);

    const handleEditRoom = (room: Room) => {
        setModalMode('edit');
        setSelectedRoom(room);

        if (room.metadata?.groupType === "school") {
            setSelectedRoomType("school");
        } else if (room.metadata?.groupType === "major") {
            setSelectedRoomType("major");
        } else {
            setSelectedRoomType(room.type);
        }

        setIsModalOpen(true);
    };

    const handleDeleteRoom = async (room: Room) => {
        try {
            await deleteRoom(room._id);
        } catch (err) {
            addToast({
                title: "Error deleting room",
                description: err instanceof Error ? err.message : "Failed to delete room",
                color: "danger",
            });
        }
    };

    const handleToggleStatus = async (room: Room) => {
        try {
            const newStatus = room.status === "active" ? "inactive" : "active";
            const formData = new FormData();
            formData.append("status", newStatus);
            formData.append("name.th", room.name.th);
            formData.append("name.en", room.name.en);
            formData.append("type", room.type);
            formData.append("capacity", room.capacity.toString());

            if (room.image) {
                formData.append("image", room.image);
            }

            await updateRoom(room._id, formData);
        } catch (err) {
            addToast({
                title: "Error updating room status",
                description: err instanceof Error ? err.message : "Failed to update room status",
                color: "danger",
            });
        }
    };

    const handleAddRoom = (type: RoomType | "school" | "major") => {
        setModalMode('add');
        setSelectedRoom(undefined);
        setSelectedRoomType(type);
        setIsModalOpen(true);
    };

    const handleSubmitRoom = async (formData: FormData, mode: "add" | "edit") => {
        if (mode === "add") {
            await createRoom(formData);
        } else if (mode === "edit" && selectedRoom?._id) {
            await updateRoom(selectedRoom._id, formData);
        }
        await fetchRooms();
        if (selectedRoomType) {
            setLastCreatedRoomType(selectedRoomType);
        }
        setIsModalOpen(false);
    };

    return (
        <>
            <div className="relative mb-4">
                <PageHeader
                    description="Chat room management"
                    icon={<MessagesSquare />}
                    title="Chat Management"
                />

                <div className="absolute top-0 right-0 mt-2 mr-4">
                    <Link href="/chat/sticker">
                        <button className="inline-flex gap-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold shadow hover:bg-primary/90 transition">
                            <SmilePlus />
                            Sticker Management
                        </button>
                    </Link>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                <RoomAccordion
                    rooms={rooms}
                    loading={loading}
                    error={error}
                    onAdd={handleAddRoom}
                    onEdit={handleEditRoom}
                    onDelete={handleDeleteRoom}
                    onToggleStatus={handleToggleStatus}
                    openAccordion={openAccordion}
                    setOpenAccordion={setOpenAccordion}
                />
            </div>

            <RoomModal
                key={selectedRoom?._id || 'new'}
                isOpen={isModalOpen}
                mode={modalMode}
                room={selectedRoom}
                roomType={selectedRoomType}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSubmitRoom}
                getRoomMembers={getRoomMembers}
            />
        </>
    );
}