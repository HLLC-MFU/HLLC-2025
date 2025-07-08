"use client";

import { 
    Card, 
    CardBody, 
    Button,
} from "@heroui/react";
import { 
    Users, 
    Gift,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { addToast } from "@heroui/toast";

import { MemberModal } from "./_components/MemberModal";
import { RestrictionAction } from "./_components/RestrictionAction";
import MemberTable from "./_components/MemberTable";

import { RoomMember, Room } from "@/types/chat";
import { useChat } from "@/hooks/useChat";
import { PageHeader } from "@/components/ui/page-header";

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
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<{
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    } | null>(null);
    const MEMBERS_PER_PAGE = 10;

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

            if (roomData) {
                setRoom(roomData);
            }
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

    // Helper to build query string
    const buildQueryString = (params: Record<string, any>) => {
        const esc = encodeURIComponent;
        return Object.keys(params)
            .map(k => esc(k) + '=' + esc(params[k]))
            .join('&');
    };

    const loadMembers = async (page: number = 1) => {
        try {
            setIsLoadingMembers(true);
            const query = buildQueryString({ page, limit: MEMBERS_PER_PAGE });
            const result = await getRoomMembers(`${roomId}?${query}`);
            // Normalize to RoomMember[] regardless of API shape
            const members = Array.isArray(result?.data?.members)
                ? result.data.members.map((m: any) => m.user || m)
                : [];
            setMembers(members);
            // Use pagination info from backend meta if available
            const meta = result && result.data && (result.data as any).meta;
            setPagination(meta ? {
                total: meta.total,
                page: meta.page,
                limit: meta.limit,
                totalPages: meta.totalPages
            } : {
                total: members.length,
                page,
                limit: MEMBERS_PER_PAGE,
                totalPages: Math.ceil(members.length / MEMBERS_PER_PAGE)
            });
        } catch (error) {
            setMembers([]);
            setPagination(null);
            addToast({
                title: "Error loading members",
                description: error instanceof Error ? error.message : "Failed to load room members",
                color: "danger",
            });
        } finally {
            setIsLoadingMembers(false);
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        loadMembers(page);
    };

    const handleRestrictionAction = (member: RoomMember, action: 'ban' | 'mute' | 'kick' | 'unban' | 'unmute') => {
        console.log('handleRestrictionAction called:', action, member);
        setSelectedMember(member);
        setRestrictionAction(action);
        setIsRestrictionModalOpen(true);
    };

    const handleActionSuccess = () => {
        loadMembers(currentPage);
        setIsMemberModalOpen(false);
        setIsRestrictionModalOpen(false);
    };

    // Remove client-side slicing, use members as is
    const paginatedMembers = members;

    return (
        <div className="flex flex-col gap-6">
            <PageHeader 
                description="Manage room members and actions"
                icon={<Users />}
                right={
                    <div className="flex gap-2">
                        <Button
                            color="primary"
                            startContent={<Gift size={20} />}
                            onPress={() => router.push(`/chat/evoucher?roomId=${roomId}`)}
                        >
                            Send Evoucher
                        </Button>
                    </div>
                }
                title="Room Members"
            />

            {/* Room Info + Members Table Section */}
            <div className="bg-white rounded-xl shadow-sm border border-default-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-6 py-4 border-b border-default-100">
                    <div>
                        <h3 className="text-lg font-semibold">
                            {room && room.name ? (
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
                        <p className="text-default-500">
                            Total Members: {pagination?.total || members.length}
                        </p>
                    </div>
                </div>
                <div className="px-0 md:px-4 py-4 relative">
                    <MemberTable
                        currentUserId="current-user-id" // You'll need to get this from auth context
                        loading={isLoadingMembers}
                        members={paginatedMembers}
                        pagination={pagination}
                        roomId={roomId}
                        onBanMember={(member) => handleRestrictionAction(member, 'ban')}
                        onKickMember={(member) => handleRestrictionAction(member, 'kick')}
                        onMuteMember={(member) => handleRestrictionAction(member, 'mute')}
                        onPageChange={handlePageChange}
                    />
                    {isLoadingMembers && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </div>
            </div>

            {/* Member Modal */}
            <MemberModal
                isOpen={isMemberModalOpen}
                member={selectedMember}
                roomId={roomId}
                onClose={() => setIsMemberModalOpen(false)}
                onMemberKicked={loadMembers}
            />

            {/* Restriction Action Modal */}
            <RestrictionAction
                action={restrictionAction as 'ban' | 'mute'}
                isOpen={isRestrictionModalOpen}
                member={selectedMember}
                roomId={roomId} 
                onClose={() => setIsRestrictionModalOpen(false)}
                onSuccess={handleActionSuccess}
            />
        </div>
    );
} 