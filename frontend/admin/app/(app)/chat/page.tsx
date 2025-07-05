"use client";

import { PageHeader } from "@/components/ui/page-header";
import { useChat } from "@/hooks/useChat";
import { Room, RoomType } from "@/types/chat";
import { addToast } from "@heroui/react";
import { MessageSquare } from "lucide-react";
import { useState } from "react";
import RoomAccordion from "./_components/RoomAccordion";
import { RoomModal } from "./_components/RoomModal";

export default function ChatPage() {
    const { 
        room: rooms, 
        loading, 
        error, 
        fetchRoom, 
        createRoom, 
        updateRoom, 
        deleteRoom 
    } = useChat();
    
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<Room | undefined>();

    const handleEditRoom = (room: Room) => {
        setModalMode('edit');
        setSelectedRoom(room);
        setIsModalOpen(true);
    };

    const handleDeleteRoom = async (room: Room) => {
        try {
            await deleteRoom(room._id);
            await fetchRoom();
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

    const handleAddRoom = (type: RoomType | "school" | "major") => {
        setModalMode('add');
        setSelectedRoom(undefined);
        setIsModalOpen(true);
    };

    const handleSubmitRoom = async (formData: FormData, mode: "add" | "edit") => {
        try {
            if (mode === "edit" && selectedRoom) {
                await updateRoom(selectedRoom._id, formData);
            } else if (mode === "add") {
                await createRoom(formData);
            }
            
            await fetchRoom();
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
                description="Manage chat rooms"
                icon={<MessageSquare />}
                title="Chat Room Management"
            />

            <div className="flex flex-col gap-6">
                <RoomAccordion 
                    rooms={rooms}
                    onAdd={handleAddRoom}
                    onEdit={handleEditRoom}
                    onDelete={handleDeleteRoom}
                />
            </div>

            <RoomModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSuccess={handleSubmitRoom}
                room={selectedRoom}
                mode={modalMode}
            />
        </>
    );
}