"use client";

import { PageHeader } from "@/components/ui/page-header";
import { useChat } from "@/hooks/useChat";
import { Room, RoomType } from "@/types/chat";
import { addToast, Button } from "@heroui/react";
import { MessageSquare, Plus } from "lucide-react";
import { useState } from "react";
import RoomAccordion from "./_components/RoomAccordion";

export default function ChatPage() {
    const { room, loading: roomLoading, error: roomError, fetchRoom, createRoom, updateRoom, deleteRoom } = useChat();
    const isLoading = roomLoading;
    
    // Log to check if hook is working
    console.log("ChatPage - Hook data:", { 
        roomCount: room?.length || 0, 
        loading: roomLoading, 
        error: roomError,
        rooms: room 
    });
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmationModalType, setConfirmationModalType] = useState<
        'delete' | 'edit' | null
    >(null);
    const [selectedRoom, setSelectedRoom] = useState<
        Room | Partial<Room> | undefined
    >();

    const handleEditRoom = (room: Room) => {
        setModalMode('edit');
        setSelectedRoom(room);
        setIsModalOpen(true);
    }

    const handleDeleteRoom = (room: Room) => {
        setSelectedRoom(room);
        setConfirmationModalType('delete');
    }

    const handleAddRoom = (type: RoomType | "school" | "major") => {
        setModalMode('add');
        setSelectedRoom({ type: type as RoomType });
        setIsModalOpen(true);
    }

    const handleSubmitRoom = async (formData: FormData, mode: "add" | "edit") => {
        try {
            if (mode === "edit" && selectedRoom && "_id" in selectedRoom && selectedRoom._id) {
                await updateRoom(selectedRoom._id, formData);
            } else if (mode === "add") {
                await createRoom(formData);
            }
            
            await fetchRoom();
            addToast({ title: `Room ${mode === "add" ? "added" : "updated"} successfully!`, color: "success" });
        } catch (err) {
            addToast({
                title: "Error while saving room",
                description: (err instanceof Error ? err.message : typeof err === "string" ? err : "Failed to save room. Please try again."),
                color: "danger",
            })
        } finally {
            setIsModalOpen(false);
        }
    }

    const handleConfirm = async () => {
        if (confirmationModalType === "delete" && 
            selectedRoom && "_id" in selectedRoom && 
            selectedRoom._id
        ) {
            await deleteRoom(selectedRoom._id);
            await fetchRoom();
            addToast({ title: "Room deleted successfully!", color: "success" });
        }
        setConfirmationModalType(null);
        setSelectedRoom(undefined);
    }

    return (
        <>
            <PageHeader 
                description="Manage chat rooms"
                icon={<MessageSquare />}
                title="Chat Room Management"
            />

            <div className="flex flex-col gap-6">
                <RoomAccordion 
                    rooms={room}
                    onAdd={handleAddRoom}
                    onEdit={handleEditRoom}
                    onDelete={handleDeleteRoom}
                />
            </div>
            
        </>
    )
}