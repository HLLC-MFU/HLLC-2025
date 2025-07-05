"use client";

import { PageHeader } from "@/components/ui/page-header";
import { useChat } from "@/hooks/useChat";
import { Room } from "@/types/chat";
import { addToast } from "@heroui/react";
import { ArrowLeft, MessageSquare, Users, Building2 } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card, CardBody, Chip, Spinner } from "@heroui/react";

export default function RoomDetailPage() {
    const router = useRouter();
    const params = useParams();
    const roomId = params.id as string;
    
    const { room: rooms, loading, fetchRoom } = useChat();
    const [room, setRoom] = useState<Room | null>(null);

    useEffect(() => {
        if (rooms && roomId) {
            const foundRoom = rooms.find(r => r._id === roomId);
            if (foundRoom) {
                setRoom(foundRoom);
            } else {
                addToast({
                    title: "Room not found",
                    description: "The requested room could not be found",
                    color: "danger",
                });
                router.push("/chat");
            }
        }
    }, [rooms, roomId, router]);

    const handleBack = () => {
        router.push("/chat");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!room) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <p className="text-default-500">Room not found</p>
                    <Button 
                        color="primary" 
                        variant="light" 
                        onPress={handleBack}
                        className="mt-4"
                    >
                        Back to Rooms
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <>
            <PageHeader 
                description={`Room details for ${room.name.en}`}
                icon={<MessageSquare />}
                title="Room Details"
                right={
                    <Button 
                        color="primary" 
                        variant="light" 
                        startContent={<ArrowLeft />}
                        onPress={handleBack}
                    >
                        Back to Rooms
                    </Button>
                }
            />

            <div className="flex flex-col gap-6">
                {/* Room Information Card */}
                <Card>
                    <CardBody className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-primary text-white text-lg items-center justify-center rounded-lg flex">
                                    {room.name.en.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold">{room.name.en}</h2>
                                    <p className="text-default-500">{room.name.th}</p>
                                </div>
                            </div>
                            <Chip 
                                color={room.type === "normal" ? "primary" : "secondary"}
                                variant="flat"
                            >
                                {room.type === "normal" ? "Normal" : "Read Only"}
                            </Chip>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center gap-2">
                                <Users className="text-default-400" size={20} />
                                <div>
                                    <p className="text-sm text-default-500">Members</p>
                                    <p className="font-semibold">{room.memberCount}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Building2 className="text-default-400" size={20} />
                                <div>
                                    <p className="text-sm text-default-500">Capacity</p>
                                    <p className="font-semibold">
                                        {room.capacity === 0 ? "∞" : room.capacity}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <MessageSquare className="text-default-400" size={20} />
                                <div>
                                    <p className="text-sm text-default-500">Created By</p>
                                    <p className="font-semibold">{room.createdBy}</p>
                                </div>
                            </div>
                        </div>

                        {room.metadata && Object.keys(room.metadata).length > 0 && (
                            <div className="mt-4 pt-4 border-t border-default-200">
                                <h3 className="text-sm font-semibold mb-2">Additional Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {Object.entries(room.metadata).map(([key, value]) => (
                                        <div key={key} className="flex justify-between">
                                            <span className="text-sm text-default-500 capitalize">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}:
                                            </span>
                                            <span className="text-sm font-medium">
                                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Placeholder for future features */}
                <Card>
                    <CardBody className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Room Management</h3>
                        <div className="text-center py-8">
                            <MessageSquare className="mx-auto text-default-300 mb-2" size={48} />
                            <p className="text-default-500">
                                Member management and other features coming soon...
                            </p>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </>
    );
} 