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
    isCurrentUser: boolean;
    roomId: string;
}

export default function MemberCellRenderer({
    member,
    columnKey,
    onBan,
    onMute,
    isCurrentUser,
    roomId,
}: MemberCellRendererProps) {
    // ลบ useRestriction, handleKick, และ prop onKick ที่เกี่ยวข้องกับ kick user

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
                                {/* ใน actions column: ลบปุ่ม kick ออก เหลือเฉพาะ ban/mute/view */}
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