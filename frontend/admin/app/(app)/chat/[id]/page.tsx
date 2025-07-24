"use client";

import { Button } from "@heroui/react";
import { Users, Gift, History } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { addToast } from "@heroui/toast";
import MemberTable from "./_components/MemberTable";
import { RestrictionHistory } from "./_components/RestrictionHistory";
import { GenericSkeleton } from "../_components/RoomSkeleton";
import { RoomMember, RoomByIdResponse } from "@/types/room";
import { useChat } from "@/hooks/useChat";
import { PageHeader } from "@/components/ui/page-header";

export const columns = [
    { name: "USER", uid: "user", sortable: true },
    { name: "ROLE", uid: "role", sortable: true },
    { name: "ACTIONS", uid: "actions" },
];

export function capitalize(s: string) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}

const INITIAL_VISIBLE_COLUMNS = [
    "user",
    "role",
    "actions",
];

export default function RoomDetailPage() {
    const router = useRouter();
    const params = useParams();
    const roomId = params.id as string;
    const { getRoomMembers, getRoomById } = useChat();
    const [members, setMembers] = useState<RoomMember[]>([]);
    const [room, setRoom] = useState<RoomByIdResponse | null>(null);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [isLoadingRoom, setIsLoadingRoom] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<{
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    } | null>(null);
    const [modal, setModal] = useState({
        restriction: false,
    });
    const [showHistory, setShowHistory] = useState(false);
    const MEMBERS_PER_PAGE = 10;
    // ดึง currentUserId (mock: localStorage หรือ context)
    const [currentUserId, setCurrentUserId] = useState<string>("");
    useEffect(() => {
        // สมมติใช้ localStorage (หรือเปลี่ยนเป็น useAuth().user._id ถ้ามี)
        setCurrentUserId(localStorage.getItem("userId") || "");
    }, []);

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
            // Backend returns members with nested user structure, no need to map
            const members = Array.isArray(result?.data?.members)
                ? result.data.members
                : [];
            setMembers(members);
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

    if (isLoadingRoom) {
        return (
            <div className="flex flex-col gap-2">
                <PageHeader 
                    description="Manage room members and actions"
                    icon={<Users />}
                    title="Room Members"
                />
                <div className="space-y-4">
                    <GenericSkeleton type="list" rows={1} />
                    <GenericSkeleton type="table" rows={5} />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <PageHeader 
                description="Manage room members and actions"
                icon={<Users />}
                right={
                    <div className="flex gap-2">
                        <Button
                            color="secondary"
                            startContent={<History size={20} />}
                            onPress={() => setShowHistory(true)}
                        >
                            Restriction History
                        </Button>
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

            <div className="bg-white rounded-xl shadow-sm border border-default-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-6 py-4 border-b border-default-100 bg-default-50 rounded-t-xl">
                    <div>
                        <div className="flex items-center gap-4">
                            <div>
                                <div className="text-2xl font-bold text-primary">
                                    {room?.name?.en || "-"}
                                </div>
                            </div>
                            {room?.type && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold text-sm ml-2">
                                    {room.type.charAt(0).toUpperCase() + room.type.slice(1)}
                                </span>
                            )}
                        </div>
                        <div className="text-sm text-default-500 mt-1">
                            Total Members: {pagination?.total || members.length}
                        </div>
                    </div>
                </div>
                <div className="px-0 md:px-4 py-4 relative">
                    {isLoadingMembers ? (
                        <div className="space-y-4">
                            <GenericSkeleton type="table" rows={5} />
                        </div>
                    ) : (
                        <MemberTable
                            roomId={roomId}
                            members={members}
                            modal={modal}
                            setModal={setModal}
                            capitalize={capitalize}
                            columns={columns}
                            initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
                            pagination={pagination}
                            onPageChange={handlePageChange}
                            currentUserId={currentUserId}
                        />
                    )}
                </div>
            </div>

            {showHistory && (
                <RestrictionHistory
                    roomId={roomId}
                    isOpen={showHistory}
                    onClose={() => setShowHistory(false)}
                />
            )}
        </div>
    );
} 