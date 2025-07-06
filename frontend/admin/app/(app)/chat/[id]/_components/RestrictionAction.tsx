"use client";

import { RoomMember, RestrictionAction as RestrictionActionType } from "@/types/chat";
import { useChat } from "@/hooks/useChat";
import { 
    Modal, 
    ModalContent, 
    ModalHeader, 
    ModalBody, 
    ModalFooter,
    Button,
    Input,
    Textarea,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Avatar,
    Chip
} from "@heroui/react";
import { 
    Ban, 
    Mic, 
    MicOff, 
    LogOut, 
    Shield,
    Clock,
    AlertTriangle
} from "lucide-react";
import { useState, useEffect } from "react";
import { addToast } from "@heroui/react";

interface RestrictionActionProps {
    isOpen: boolean;
    onClose: () => void;
    member: RoomMember | null;
    action: 'ban' | 'mute' | 'kick' | 'unban' | 'unmute';
    roomId: string;
    onSuccess: () => void;
}

export function RestrictionAction({ 
    isOpen, 
    onClose, 
    member, 
    action, 
    roomId, 
    onSuccess 
}: RestrictionActionProps) {
    const { banUser, muteUser, kickUser, unbanUser, unmuteUser, loading } = useChat();
    
    const [restrictionData, setRestrictionData] = useState<RestrictionActionType>({
        userId: '',
        roomId: roomId,
        action: action,
        duration: 'temporary',
        timeValue: 60,
        timeUnit: 'minutes',
        restriction: 'cannot_view',
        reason: ''
    });

    useEffect(() => {
        if (member) {
            setRestrictionData({
                ...restrictionData,
                userId: member._id,
                action: action
            });
        }
    }, [member, action]);

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'ban': return <Ban size={16} />;
            case 'mute': return <MicOff size={16} />;
            case 'kick': return <LogOut size={16} />;
            case 'unban': return <Shield size={16} />;
            case 'unmute': return <Mic size={16} />;
            default: return <AlertTriangle size={16} />;
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'ban': return 'danger';
            case 'mute': return 'warning';
            case 'kick': return 'danger';
            case 'unban': return 'success';
            case 'unmute': return 'success';
            default: return 'default';
        }
    };

    const handleSubmit = async () => {
        try {
            let result;
            switch (action) {
                case 'ban':
                    result = await banUser(restrictionData);
                    break;
                case 'mute':
                    result = await muteUser(restrictionData);
                    break;
                case 'kick':
                    result = await kickUser(restrictionData);
                    break;
                case 'unban':
                    result = await unbanUser(restrictionData);
                    break;
                case 'unmute':
                    result = await unmuteUser(restrictionData);
                    break;
            }
            
            addToast({
                title: `User ${action}ed successfully!`,
                color: "success",
            });
            onSuccess();
        } catch (error) {
            addToast({
                title: `Error ${action}ing user`,
                description: error instanceof Error ? error.message : `Failed to ${action} user`,
                color: "danger",
            });
        }
    };

    if (!member) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl">
            <ModalContent>
                <ModalHeader>
                    <div className="flex items-center gap-2">
                        {getActionIcon(action)}
                        {action.charAt(0).toUpperCase() + action.slice(1)} User
                    </div>
                </ModalHeader>
                <ModalBody>
                    {/* User Info */}
                    <div className="mb-4 p-3 bg-default-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            {(() => {
                                const nameObj = member.name || {};
                                const fullName = [nameObj.first, nameObj.middle, nameObj.last].filter(Boolean).join(" ") || member.username || "";
                                return (
                                    <>
                                        <Avatar
                                            name={fullName}
                                            size="sm"
                                        />
                                        <div>
                                            <p className="font-semibold">User: {member.username}</p>
                                            <p className="text-small text-default-500">
                                                {fullName}
                                            </p>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                    
                    {/* Action Form */}
                    <div className="flex flex-col gap-4">
                        {(action === 'ban' || action === 'mute') && (
                            <>
                                <div className="flex gap-2">
                                    <Button
                                        variant={restrictionData.duration === 'temporary' ? 'solid' : 'bordered'}
                                        size="sm"
                                        onPress={() => setRestrictionData({...restrictionData, duration: 'temporary'})}
                                    >
                                        Temporary
                                    </Button>
                                    <Button
                                        variant={restrictionData.duration === 'permanent' ? 'solid' : 'bordered'}
                                        size="sm"
                                        onPress={() => setRestrictionData({...restrictionData, duration: 'permanent'})}
                                    >
                                        Permanent
                                    </Button>
                                </div>
                                
                                {restrictionData.duration === 'temporary' && (
                                    <div className="flex gap-2">
                                        <Input
                                            type="number"
                                            label="Duration"
                                            placeholder="60"
                                            value={restrictionData.timeValue?.toString() || ''}
                                            onValueChange={(value) => setRestrictionData({...restrictionData, timeValue: parseInt(value) || 60})}
                                        />
                                        <Dropdown>
                                            <DropdownTrigger>
                                                <Button variant="bordered">
                                                    {restrictionData.timeUnit}
                                                </Button>
                                            </DropdownTrigger>
                                            <DropdownMenu
                                                selectedKeys={[restrictionData.timeUnit || 'minutes']}
                                                onSelectionChange={(keys) => {
                                                    const selected = Array.from(keys)[0] as string;
                                                    setRestrictionData({...restrictionData, timeUnit: selected as 'minutes' | 'hours'});
                                                }}
                                            >
                                                <DropdownItem key="minutes">Minutes</DropdownItem>
                                                <DropdownItem key="hours">Hours</DropdownItem>
                                            </DropdownMenu>
                                        </Dropdown>
                                    </div>
                                )}
                            </>
                        )}
                        
                        {action === 'mute' && (
                            <Dropdown>
                                <DropdownTrigger>
                                    <Button variant="bordered" className="w-full justify-start">
                                        Restriction: {restrictionData.restriction}
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu
                                    selectedKeys={[restrictionData.restriction || 'cannot_view']}
                                    onSelectionChange={(keys) => {
                                        const selected = Array.from(keys)[0] as string;
                                        setRestrictionData({...restrictionData, restriction: selected as 'can_view' | 'cannot_view'});
                                    }}
                                >
                                    <DropdownItem key="can_view">Can View Messages</DropdownItem>
                                    <DropdownItem key="cannot_view">Cannot View Messages</DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                        )}
                        
                        <Textarea
                            label="Reason"
                            placeholder="Enter reason for this action"
                            value={restrictionData.reason}
                            onValueChange={(value) => setRestrictionData({...restrictionData, reason: value})}
                        />
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button variant="light" onPress={onClose}>
                        Cancel
                    </Button>
                    <Button 
                        color={getActionColor(action) as any}
                        startContent={getActionIcon(action)}
                        onPress={handleSubmit}
                        isLoading={loading}
                    >
                        {action.charAt(0).toUpperCase() + action.slice(1)} User
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
