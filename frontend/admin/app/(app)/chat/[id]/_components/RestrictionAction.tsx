"use client";

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Avatar, Input, Textarea, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { Ban, MicOff, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { addToast } from "@heroui/toast";

import { useRestriction } from "@/hooks/useRestriction";

import { RoomMember } from "@/types/chat";

type RestrictionAction = {
    userId: string;
    roomId: string;
    action: 'ban' | 'mute';
    duration: 'temporary' | 'permanent';
    timeValue: number;
    timeUnit: 'minutes' | 'hours';
    restriction: 'can_view' | 'cannot_view';
    reason: string;
};

type RestrictionActionProps = {
    isOpen: boolean;
    onClose: () => void;
    member: RoomMember | null;
    action: 'ban' | 'mute';
    roomId: string;
    onSuccess: () => void;
};

export function RestrictionAction({ isOpen, onClose, member, action, roomId, onSuccess }: RestrictionActionProps) {
    const { banUser, muteUser, loading } = useRestriction();
    const [restrictionData, setRestrictionData] = useState<RestrictionAction>({
        userId: '',
        roomId: roomId,
        action: action,
        duration: 'temporary',
        timeValue: 15,
        timeUnit: 'minutes',
        restriction: 'can_view',
        reason: ''
    });

    useEffect(() => {
        if (member && isOpen) {
            setRestrictionData(prev => ({
                ...prev,
                userId: member._id,
                action: action,
                roomId: roomId
            }));
        } else if (!isOpen) {
            setRestrictionData({
                userId: '',
                roomId: roomId,
                action: action,
                duration: 'temporary',
                timeValue: 15,
                timeUnit: 'minutes',
                restriction: 'can_view',
                reason: ''
            });
        }
    }, [member, action, isOpen, roomId]);

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'ban': return <Ban size={16} />;
            case 'mute': return <MicOff size={16} />;
            default: return <AlertTriangle size={16} />;
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'ban': return 'danger';
            case 'mute': return 'warning';
            default: return 'default';
        }
    };

    const handleSubmit = async () => {
        try {
            if (!restrictionData.userId || !restrictionData.roomId || !restrictionData.reason) {
                addToast({
                    title: "Missing required information",
                    description: "Please fill in all required fields",
                    color: "warning",
                });

                return;
            }
            if (action === 'ban') {
                await banUser(restrictionData);
            } else if (action === 'mute') {
                await muteUser(restrictionData);
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

    // Fallback logic for name
    const nameObj = member.name || {};
    const fullName = [nameObj.first, nameObj.middle, nameObj.last].filter(Boolean).join(" ") || member.username || "";

    return (
        <Modal isOpen={isOpen} size="2xl" onClose={onClose}>
            <ModalContent>
                <ModalHeader>
                    <div className="flex items-center gap-2">
                        {getActionIcon(action)}
                        {action.charAt(0).toUpperCase() + action.slice(1)} User
                    </div>
                </ModalHeader>
                <ModalBody>
                    <div className="mb-4 p-3 bg-default-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Avatar name={fullName} size="sm" />
                                        <div>
                                            <p className="font-semibold">User: {member.username}</p>
                                <p className="text-small text-default-500">{fullName}</p>
                                        </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4">
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant={restrictionData.duration === 'temporary' ? 'solid' : 'bordered'}
                                onPress={() => setRestrictionData({ ...restrictionData, duration: 'temporary' as 'temporary' })}
                                    >
                                        Temporary
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={restrictionData.duration === 'permanent' ? 'solid' : 'bordered'}
                                onPress={() => setRestrictionData({ ...restrictionData, duration: 'permanent' as 'permanent' })}
                                    >
                                        Permanent
                                    </Button>
                                </div>
                                {restrictionData.duration === 'temporary' && (
                                    <div className="flex gap-2">
                                        <Input
                                            label="Duration"
                                            placeholder="15"
                                            type="number"
                                            value={restrictionData.timeValue?.toString() || ''}
                                    onValueChange={(value) => setRestrictionData({ ...restrictionData, timeValue: parseInt(value) || 15 })}
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

                                            setRestrictionData({ ...restrictionData, timeUnit: selected as 'minutes' | 'hours' });
                                                }}
                                            >
                                                <DropdownItem key="minutes">Minutes</DropdownItem>
                                                <DropdownItem key="hours">Hours</DropdownItem>
                                            </DropdownMenu>
                                        </Dropdown>
                                    </div>
                                )}
                        {action === 'mute' && (
                            <Dropdown>
                                <DropdownTrigger>
                                    <Button className="w-full justify-start" variant="bordered">
                                        Restriction: {restrictionData.restriction}
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu
                                    selectedKeys={[restrictionData.restriction || 'can_view']}
                                    onSelectionChange={(keys) => {
                                        const selected = Array.from(keys)[0] as string;

                                        setRestrictionData({ ...restrictionData, restriction: selected as 'can_view' | 'cannot_view' });
                                    }}
                                >
                                    <DropdownItem key="can_view">Can View Messages</DropdownItem>
                                    <DropdownItem key="cannot_view">Cannot View Messages</DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                        )}
                        <Textarea
                            isRequired
                            label="Reason"
                            placeholder="Enter reason for this action"
                            value={restrictionData.reason}
                            onValueChange={(value) => setRestrictionData({ ...restrictionData, reason: value })}
                        />
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button variant="light" onPress={onClose}>
                        Cancel
                    </Button>
                    <Button 
                        color={getActionColor(action) as any}
                        isDisabled={!restrictionData.userId || !restrictionData.reason}
                        isLoading={loading}
                        startContent={getActionIcon(action)}
                        onPress={handleSubmit}
                    >
                        {action.charAt(0).toUpperCase() + action.slice(1)} User
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
