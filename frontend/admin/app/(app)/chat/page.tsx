"use client";

import { PageHeader } from "@/components/ui/page-header";
import { useChat } from "@/hooks/useChat";
import { Room, RoomType } from "@/types/chat";
import { addToast } from "@heroui/react";
import { useState, useEffect } from "react";
import RoomAccordion from "./_components/RoomAccordion";
import { RoomModal } from "./_components/RoomModal";
import Link from "next/link";
import { Smile } from "lucide-react";

export default function ChatPage() {
    const { 
        room: rooms, 
        fetchRoom, 
        createRoom, 
        updateRoom, 
        deleteRoom 
    } = useChat();
    
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<Room | undefined>();
    const [selectedRoomType, setSelectedRoomType] = useState<RoomType | "school" | "major">(RoomType.NORMAL);
    const [currentPage, setCurrentPage] = useState(1);
    const roomsPerPage = 8; // ปรับจำนวนต่อหน้าได้

    useEffect(() => {
        fetchRoom(currentPage, roomsPerPage);
    }, [currentPage]);


    const handleEditRoom = (room: Room) => {
        setModalMode('edit');
        setSelectedRoom(room);
        // Determine room type from room metadata
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
            await fetchRoom(currentPage, 10);
            addToast({ 
                title: "Room deleted successfully!", 
                color: "success" 
            });
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
            
            // Create form data with only status field
            const formData = new FormData();
            formData.append("status", newStatus);
            // Keep other fields unchanged
            formData.append("name.th", room.name.th);
            formData.append("name.en", room.name.en);
            formData.append("type", room.type);
            formData.append("capacity", room.capacity.toString());
            if (room.image) {
                formData.append("image", room.image);
            }
            
            await updateRoom(room._id, formData);
            await fetchRoom(currentPage, 10);
            addToast({ 
                title: `Room ${newStatus === "active" ? "activated" : "deactivated"} successfully!`, 
                color: "success" 
            });
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
        try {
            if (mode === "edit" && selectedRoom) {
                await updateRoom(selectedRoom._id, formData);
            } else if (mode === "add") {
                await createRoom(formData);
            }
            
            await fetchRoom(currentPage, 10);
            addToast({ 
                title: `Room ${mode === "add" ? "added" : "updated"} successfully!`, 
                color: "success" 
            });
            setIsModalOpen(false);
        } catch (err) {
            addToast({
                title: "Error while saving room",
                description: err instanceof Error ? err.message : "Failed to save room",
                color: "danger",
            });
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedRoom(undefined);
    };

    return (
        <>
            <PageHeader 
                description="Chat room management"
                icon={<Smile />}
                title="Chat Management"
            />
            <div className="flex justify-end mb-4">
                <Link href="/chat/sticker">
                    <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold shadow hover:bg-primary/90 transition">
                        <Smile className="w-5 h-5" />
                        Sticker Management
                    </button>
                </Link>
            </div>

            <div className="flex flex-col gap-6">
                <RoomAccordion 
                    rooms={rooms}
                    onAdd={handleAddRoom}
                    onEdit={handleEditRoom}
                    onDelete={handleDeleteRoom}
                    onToggleStatus={handleToggleStatus}
                />
            </div>

            <RoomModal
                key={selectedRoom?._id || 'new'}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSuccess={handleSubmitRoom}
                room={selectedRoom}
                mode={modalMode}
                roomType={selectedRoomType}
            />
        </>
    );
}