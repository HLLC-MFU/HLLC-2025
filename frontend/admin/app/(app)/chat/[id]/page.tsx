"use client";

import { PageHeader } from "@/components/ui/page-header";
import { useChat } from "@/hooks/useChat";
import { RoomMember } from "@/types/chat";
import { 
    Card, 
    CardBody, 
    Button, 
    Chip,
    Avatar,
    Badge,
    Table, 
    TableHeader, 
    TableColumn, 
    TableBody, 
    TableRow, 
    TableCell,
    Dropdown, 
    DropdownTrigger, 
    DropdownMenu, 
    DropdownItem,
} from "@heroui/react";
import { 
    ArrowLeft, 
    Users, 
    MoreVertical, 
    Ban, 
    Mic, 
    MicOff, 
    LogOut, 
    Gift,
    Eye,
    Clock,
    Sticker,
    MessageSquare
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { addToast } from "@heroui/react";
import { MemberCellRender } from "./_components/MemberCellRender";
import { MemberModal } from "./_components/MemberModal";
import { RestrictionAction } from "./_components/RestrictionAction";

export default function RoomDetailPage() {
    const router = useRouter();
    const params = useParams();
    const roomId = params.id as string;
    
    const { getRoomMembers, loading } = useChat();

    const [members, setMembers] = useState<RoomMember[]>([]);
    const [selectedMember, setSelectedMember] = useState<RoomMember | null>(null);
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
    const [isRestrictionModalOpen, setIsRestrictionModalOpen] = useState(false);
    const [restrictionAction, setRestrictionAction] = useState<'ban' | 'mute' | 'kick' | 'unban' | 'unmute'>('ban');
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);

    useEffect(() => {
        if (roomId) {
            loadMembers();
        }
    }, [roomId]);

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
                            <h3 className="text-lg font-semibold">Room ID: {roomId}</h3>
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
                            <Button
                                color="secondary"
                                startContent={<Sticker size={20} />}
                                onPress={() => router.push(`/chat/sticker?roomId=${roomId}`)}
                            >
                                Send Sticker
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Members Table */}
            <Card>
                <CardBody>
                    <Table aria-label="Room members table">
                        <TableHeader>
                            <TableColumn>USER</TableColumn>
                            <TableColumn>ROLE</TableColumn>
                            <TableColumn>STATUS</TableColumn>
                            <TableColumn>JOINED</TableColumn>
                            <TableColumn>ACTIONS</TableColumn>
                        </TableHeader>
                        <TableBody emptyContent="No members found">
                            {members.map((member) => (
                                <TableRow key={member._id}>
                                    <TableCell>
                                        <MemberCellRender member={member} />
                                    </TableCell>
                                    <TableCell>
                                        <Chip size="sm" variant="flat">
                                            {member.role.name}
                                        </Chip>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                color={member.isOnline ? "success" : "default"}
                                                size="sm"
                                            >
                                                {member.isOnline ? "Online" : "Offline"}
                                            </Badge>
                                            {member.lastSeen && (
                                                <Chip size="sm" variant="flat" startContent={<Clock size={12} />}>
                                                    {new Date(member.lastSeen).toLocaleDateString()}
                                                </Chip>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        <Dropdown>
                                            <DropdownTrigger>
                                                <Button
                                                    variant="light"
                                                    isIconOnly
                                                    size="sm"
                                                >
                                                    <MoreVertical size={16} />
                                                </Button>
                                            </DropdownTrigger>
                                            <DropdownMenu aria-label="User actions">
                                                <DropdownItem
                                                    key="view"
                                                    startContent={<Eye size={16} />}
                                                    onPress={() => handleViewMember(member)}
                                                >
                                                    View Profile
                                                </DropdownItem>
                                                <DropdownItem
                                                    key="ban"
                                                    className="text-danger"
                                                    color="danger"
                                                    startContent={<Ban size={16} />}
                                                    onPress={() => handleRestrictionAction(member, 'ban')}
                                                >
                                                    Ban User
                                                </DropdownItem>
                                                <DropdownItem
                                                    key="mute"
                                                    className="text-warning"
                                                    color="warning"
                                                    startContent={<MicOff size={16} />}
                                                    onPress={() => handleRestrictionAction(member, 'mute')}
                                                >
                                                    Mute User
                                                </DropdownItem>
                                                <DropdownItem
                                                    key="kick"
                                                    className="text-danger"
                                                    color="danger"
                                                    startContent={<LogOut size={16} />}
                                                    onPress={() => handleRestrictionAction(member, 'kick')}
                                                >
                                                    Kick User
                                                </DropdownItem>
                                            </DropdownMenu>
                                        </Dropdown>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>

            {/* Member Modal */}
            <MemberModal
                isOpen={isMemberModalOpen}
                onClose={() => setIsMemberModalOpen(false)}
                member={selectedMember}
            />

            {/* Restriction Action Modal */}
            <RestrictionAction
                isOpen={isRestrictionModalOpen}
                onClose={() => setIsRestrictionModalOpen(false)}
                member={selectedMember}
                action={restrictionAction}
                roomId={roomId}
                onSuccess={handleActionSuccess}
            />
        </div>
    );
} 