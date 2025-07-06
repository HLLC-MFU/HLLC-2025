"use client";

import { RoomMember } from "@/types/chat";
import { Avatar } from "@heroui/react";

interface MemberCellRenderProps {
    member: RoomMember;
}

export function MemberCellRender({ member }: MemberCellRenderProps) {
    // Fallback logic for name
    const nameObj = member.name || {};
    const fullName = [nameObj.first, nameObj.middle, nameObj.last].filter(Boolean).join(" ") || member.username || "";

    return (
        <div className="flex items-center gap-3">
            <Avatar
                name={fullName}
                size="sm"
            />
            <div>
                <p className="font-semibold">{member.username}</p>
                <p className="text-small text-default-500">
                    {fullName}
                </p>
            </div>
        </div>
    );
}
