import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Tooltip } from "@heroui/react";
import { EllipsisVertical, Ban, MicOff, CheckCircle, XCircle, UserX } from "lucide-react";
import { RoomMember } from "@/types/room";

type MemberActionsProps = {
    member: RoomMember;
    onAction: (member: RoomMember, action: 'ban' | 'mute' | 'unban' | 'unmute' | 'kick') => void;
    currentUserId: string;
};

export function MemberActions({ member, onAction, currentUserId }: MemberActionsProps) {
    const isBanned = member.restrictionStatus?.isBanned;
    const isMuted = member.restrictionStatus?.isMuted;
    if (member.user._id === currentUserId) return null;

    return (
        <div className="flex items-center gap-2">
            {/* Quick action buttons */}
            <div className="flex gap-1">
                {/* Ban/Unban button */}
                <Tooltip content={isBanned ? "Unban User" : "Ban User"}>
                    <Button
                        isIconOnly
                        size="sm"
                        color={isBanned ? "success" : "danger"}
                        variant="flat"
                        onPress={() => onAction(member, isBanned ? 'unban' : 'ban')}
                        className="min-w-[32px] h-8"
                    >
                        {isBanned ? <CheckCircle size={14} /> : <Ban size={14} />}
                    </Button>
                </Tooltip>
                
                {/* Mute/Unmute button */}
                <Tooltip content={isMuted ? "Unmute User" : "Mute User"}>
                    <Button
                        isIconOnly
                        size="sm"
                        color={isMuted ? "success" : "warning"}
                        variant="flat"
                        onPress={() => onAction(member, isMuted ? 'unmute' : 'mute')}
                        className="min-w-[32px] h-8"
                    >
                        {isMuted ? <XCircle size={14} /> : <MicOff size={14} />}
                    </Button>
                </Tooltip>
            </div>
            
            {/* More options dropdown */}
            <Dropdown>
                <DropdownTrigger>
                    <Button 
                        isIconOnly 
                        size="sm" 
                        variant="light"
                        className="min-w-[32px] h-8"
                    >
                        <EllipsisVertical size={14} className="text-default-400" />
                    </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Member actions">
                    {/* Ban/Unban options */}
                    {!isBanned ? (
                        <DropdownItem
                            key="ban"
                            startContent={<Ban size={16} />}
                            className="text-danger"
                            color="danger"
                            onPress={() => onAction(member, 'ban')}
                        >
                            Ban User
                        </DropdownItem>
                    ) : (
                        <DropdownItem
                            key="unban"
                            startContent={<CheckCircle size={16} />}
                            className="text-success"
                            color="success"
                            onPress={() => onAction(member, 'unban')}
                        >
                            Unban User
                        </DropdownItem>
                    )}
                    
                    {/* Mute/Unmute options */}
                    {!isMuted ? (
                        <DropdownItem
                            key="mute"
                            startContent={<MicOff size={16} />}
                            className="text-warning"
                            color="warning"
                            onPress={() => onAction(member, 'mute')}
                        >
                            Mute User
                        </DropdownItem>
                    ) : (
                        <DropdownItem
                            key="unmute"
                            startContent={<XCircle size={16} />}
                            className="text-success"
                            color="success"
                            onPress={() => onAction(member, 'unmute')}
                        >
                            Unmute User
                        </DropdownItem>
                    )}
                    
                    {/* Kick action */}
                    <DropdownItem
                        key="kick"
                        startContent={<UserX size={16} />}
                        className="text-secondary"
                        color="secondary"
                        onPress={() => onAction(member, 'kick')}
                    >
                        Kick User
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
        </div>
    );
} 