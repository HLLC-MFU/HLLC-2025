import React from "react";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Avatar, Chip, Badge } from "@heroui/react";
import { MoreVertical, Eye, Ban, MicOff, LogOut, Clock } from "lucide-react";
import { RoomMember } from "@/types/chat";

export type MemberColumnKey =
    | "user"
    | "role"
    | "status"
    | "joined"
    | "actions";

type MemberCellRendererProps = {
    member: RoomMember;
    columnKey: MemberColumnKey;
    onView: () => void;
    onBan: () => void;
    onMute: () => void;
    onKick: () => void;
    isCurrentUser: boolean;
}

export default function MemberCellRenderer({
    member,
    columnKey,
    onView,
    onBan,
    onMute,
    onKick,
    isCurrentUser,
}: MemberCellRendererProps) {
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

        case "status":
            return (
                <div className="flex items-center gap-2 min-w-[150px]">
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
            );

        case "joined":
            return (
                <div className="flex items-center min-w-[120px]">
                    <span className="text-small text-default-500">
                        {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'N/A'}
                    </span>
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
                                    onPress={onView}
                                >
                                    View Profile
                                </DropdownItem>
                                <DropdownItem
                                    key="ban"
                                    className="text-danger"
                                    color="danger"
                                    startContent={<Ban size={16} />}
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
                                    onPress={onKick}
                                >
                                    Kick User
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