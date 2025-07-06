"use client";

import { PageHeader } from "@/components/ui/page-header";
import { useChat } from "@/hooks/useChat";
import { RoomMember, Room } from "@/types/chat";
import { 
    Card, 
    CardBody, 
    Button, 
    Chip,
} from "@heroui/react";
import { 
    ArrowLeft, 
    Users, 
    Gift,
    Sticker,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { addToast } from "@heroui/react";
import { MemberModal } from "./_components/MemberModal";
import { RestrictionAction } from "./_components/RestrictionAction";
import MemberTable from "./_components/MemberTable";

export default function RoomDetailPage() {
    const router = useRouter();
    const params = useParams();
    const roomId = params.id as string;
    
    const { getRoomMembers, getRoomById, loading } = useChat();

    const [members, setMembers] = useState<RoomMember[]>([]);
    const [room, setRoom] = useState<Room | null>(null);
    const [selectedMember, setSelectedMember] = useState<RoomMember | null>(null);
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
    const [isRestrictionModalOpen, setIsRestrictionModalOpen] = useState(false);
    const [restrictionAction, setRestrictionAction] = useState<'ban' | 'mute' | 'kick' | 'unban' | 'unmute'>('ban');
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [isLoadingRoom, setIsLoadingRoom] = useState(false);

    useEffect(() => {
        if (roomId) {
            loadRoom();
            loadMembers();
        }
    }, [roomId]);

    const loadRoom = async () => {
        try {
            setIsLoadingRoom(true);
            const roomData = await getRoomById(roomId);
            setRoom(roomData);
        } catch (error) {
            addToast({
                title: "Error loading room",
                description: error instanceof Error ? error.message : "Failed to load room information",
                color: "danger",
            });
        } finally {
            setIsLoadingRoom(false);
        }
    };

    const loadMembers = async () => {
        try {
            setIsLoadingMembers(true);
            const roomMembers = await getRoomMembers(roomId);
            setMembers(roomMembers);
        } catch (error) {
            addToast({
                title: "Error loading members",
                description: error instanceof Error ? error.message : "Failed to load room members",
                color: "danger",
            });
        } finally {
            setIsLoadingMembers(false);
        }
    };

    const handleViewMember = (member: RoomMember) => {
        setSelectedMember(member);
        setIsMemberModalOpen(true);
    };

    const handleRestrictionAction = (member: RoomMember, action: 'ban' | 'mute' | 'kick' | 'unban' | 'unmute') => {
        console.log('handleRestrictionAction called:', action, member);
        setSelectedMember(member);
        setRestrictionAction(action);
        setIsRestrictionModalOpen(true);
    };

    const handleActionSuccess = () => {
        loadMembers();
        setIsMemberModalOpen(false);
        setIsRestrictionModalOpen(false);
    };

    if (isLoadingMembers) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-2">
                        <div className="h-8 w-48 bg-default-200 rounded-lg animate-pulse" />
                        <div className="h-4 w-32 bg-default-200 rounded-lg animate-pulse" />
                    </div>
                    <div className="h-10 w-32 bg-default-200 rounded-lg animate-pulse" />
                </div>
                <Card>
                    <CardBody>
                        <div className="space-y-4">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <div key={index} className="h-16 bg-default-200 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <PageHeader 
                description="Manage room members and actions"
                icon={<Users />}
                title="Room Members"
                right={
                    <Button
                        variant="light"
                        startContent={<ArrowLeft size={20} />}
                        onPress={() => router.back()}
                    >
                        Back to Rooms
                    </Button>
                }
            />

            {/* Room Info Card */}
            <Card>
                <CardBody>
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-semibold">
                                {room ? (
                                    <>
                                        <span className="text-default-600">EN: </span>
                                        {room.name.en}
                                        <span className="text-default-600 ml-4">TH: </span>
                                        {room.name.th}
                                    </>
                                ) : (
                                    `Room ID: ${roomId}`
                                )}
                            </h3>
                            <p className="text-default-500">Total Members: {members.length}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                color="primary"
                                startContent={<Gift size={20} />}
                                onPress={() => router.push(`/chat/evoucher?roomId=${roomId}`)}
                            >
                                Send Evoucher
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Members Table */}
            <Card>
                <CardBody>
                    <MemberTable
                        members={members}
                        currentUserId="current-user-id" // You'll need to get this from auth context
                        onViewMember={handleViewMember}
                        onBanMember={(member) => handleRestrictionAction(member, 'ban')}
                        onMuteMember={(member) => handleRestrictionAction(member, 'mute')}
                        onKickMember={(member) => handleRestrictionAction(member, 'kick')}
                    />
                </CardBody>
            </Card>

            {/* Member Modal */}
            <MemberModal
                isOpen={isMemberModalOpen}
                onClose={() => setIsMemberModalOpen(false)}
                member={selectedMember}
                roomId={roomId}
                onMemberKicked={loadMembers}
            />

            {/* Restriction Action Modal */}
            <RestrictionAction
                isOpen={isRestrictionModalOpen}
                onClose={() => setIsRestrictionModalOpen(false)}
                member={selectedMember}
                action={restrictionAction as 'ban' | 'mute'} 
                roomId={roomId}
                onSuccess={handleActionSuccess}
            />
        </div>
    );
} 