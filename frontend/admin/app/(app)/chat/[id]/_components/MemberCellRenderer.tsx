import React from "react";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Avatar, Chip, Badge } from "@heroui/react";
import { MoreVertical, Eye, MicOff, LogOut } from "lucide-react";
import { RoomMember } from "@/types/chat";
import { useRestriction } from "../_hooks/useRestriction";
import { addToast } from "@heroui/toast";

export type MemberColumnKey =
    | "user"
    | "role"
    | "actions";

type MemberCellRendererProps = {
    member: RoomMember;
    columnKey: MemberColumnKey;
    onBan: () => void;
    onMute: () => void;
    onKick: () => void;
    isCurrentUser: boolean;
    roomId: string;
}

export default function MemberCellRenderer({
    member,
    columnKey,
    onBan,
    onMute,
    onKick,
    isCurrentUser,
    roomId,
}: MemberCellRendererProps) {
    const { kickUser, loading } = useRestriction();

    const handleKick = async () => {
        try {
            await kickUser({
                userId: member._id,
                roomId: roomId,
                action: 'kick',
                reason: 'Kicked by administrator',
            });
            addToast({
                title: 'User kicked successfully',
                description: member.username + ' has been kicked from the room',
                color: 'success',
            });
            onKick();
        } catch (error) {
            addToast({
                title: 'Error kicking user',
                description: error instanceof Error ? error.message : 'Failed to kick user',
                color: 'danger',
            });
            console.error('[Kick] error:', error);
        }
    };

    const formatName = (member: RoomMember) => {
        const nameObj = member.name || {};
        return [nameObj.first, nameObj.middle, nameObj.last].filter(Boolean).join(" ") || member.username || "Unknown";
    };

    const getRoleColor = (role: string) => {
        switch (role?.toLowerCase()) {
            case 'administrator':
                return 'warning';
            case 'staff':
                return 'primary';
            default:
                return 'default';
        }
    };

    switch (columnKey) {
        case "user":
            return (
                <div className="flex items-center gap-3 min-w-[200px]">
                    <Avatar 
                        name={formatName(member)} 
                        size="sm"
                    />
                    <div className="flex flex-col">
                        <span className="font-semibold text-small">
                            {member.username}
                            {isCurrentUser && (
                                <Chip size="sm" color="primary" className="ml-2">
                                    You
                                </Chip>
                            )}
                        </span>
                        <span className="text-tiny text-default-500">
                            {formatName(member)}
                        </span>
                    </div>
                </div>
            );

        case "role":
            return (
                <div className="flex items-center min-w-[120px]">
                    <Chip 
                        size="sm" 
                        color={getRoleColor(member.role?.name)}
                        variant="flat"
                    >
                        {member.role?.name || 'Member'}
                    </Chip>
                </div>
            );

        case "actions":
            return (
                <div className="flex items-center justify-center w-[80px]">
                    {!isCurrentUser ? (
                        <Dropdown>
                            <DropdownTrigger>
                                <Button 
                                    isIconOnly 
                                    size="sm" 
                                    variant="light"
                                >
                                    <MoreVertical size={16} />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Member actions">
                                <DropdownItem
                                    key="view"
                                    startContent={<Eye size={16} />}
                                    onPress={onBan}
                                >
                                    Ban User
                                </DropdownItem>
                                <DropdownItem
                                    key="mute"
                                    className="text-warning"
                                    color="warning"
                                    startContent={<MicOff size={16} />}
                                    onPress={onMute}
                                >
                                    Mute User
                                </DropdownItem>
                                <DropdownItem
                                    key="kick"
                                    className="text-danger"
                                    color="danger"
                                    startContent={<LogOut size={16} />}
                                    onPress={handleKick}
                                    isDisabled={loading}
                                >
                                    {loading ? 'Kicking...' : 'Kick User'}
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    ) : (
                        <span className="text-small text-default-400">
                            Yourself
                        </span>
                    )}
                </div>
            );

        default:
            return null;
    }
} 