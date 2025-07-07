import React from "react";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Avatar, Chip } from "@heroui/react";
import { MoreVertical, Eye, MicOff } from "lucide-react";

import { RoomMember } from "@/types/chat";

export type MemberColumnKey = "user" | "role" | "actions";

type MemberCellRendererProps = {
    member: RoomMember;
    columnKey: MemberColumnKey;
    onBan: () => void;
    onMute: () => void;
    isCurrentUser: boolean;
};

const formatName = (member: RoomMember) => {
    const { first, middle, last } = member.name || {};

    return [first, middle, last].filter(Boolean).join(" ") || member.username || "Unknown";
};

const getRoleColor = (role: string): "warning" | "primary" | "default" => {
    const roleLower = role?.toLowerCase();

    if (roleLower === "administrator") return "warning";
    if (roleLower === "mentee") return "primary";

    return "default";
};

export default function MemberCellRenderer({
    member,
    columnKey,
    onBan,
    onMute,
    isCurrentUser,
}: MemberCellRendererProps) {
    const name = formatName(member);
    const roleColor = getRoleColor(member.role?.name);

    if (columnKey === "user") {
        return (
            <div className="flex items-center gap-3 min-w-[200px]">
                <Avatar name={name} size="sm" />
                <div className="flex flex-col">
                    <span className="font-semibold text-small">
                        {member.username}
                        {isCurrentUser && <Chip className="ml-2" color="primary" size="sm">You</Chip>}
                    </span>
                    <span className="text-tiny text-default-500">{name}</span>
                </div>
            </div>
        );
    }

    if (columnKey === "role") {
        return (
            <div className="flex items-center min-w-[120px]">
                <Chip color={roleColor} size="sm" variant="flat">{member.role?.name || "Member"}</Chip>
            </div>
        );
    }

    if (columnKey === "actions") {
        return (
            <div className="flex items-center justify-center w-[80px]">
                {!isCurrentUser ? (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <MoreVertical size={16} />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Member actions">
                            <DropdownItem key="ban" startContent={<Eye size={16} />} onPress={onBan}>Ban User</DropdownItem>
                            <DropdownItem key="mute" className="text-warning" color="warning" startContent={<MicOff size={16} />} onPress={onMute}>Mute User</DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                ) : (
                    <span className="text-small text-default-400">Yourself</span>
                )}
            </div>
        );
    }

    return null;
}