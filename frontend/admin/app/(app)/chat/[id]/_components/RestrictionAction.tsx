"use client";

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Avatar, Input, Textarea, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Badge, Divider } from "@heroui/react";
import { Ban, MicOff, AlertTriangle, CheckCircle, XCircle, Clock, UserX } from "lucide-react";
import { useState, useEffect } from "react";
import { addToast } from "@heroui/toast";

import { useRestriction } from "@/hooks/useRestriction";

import { RoomMember } from "@/types/room";

type RestrictionAction = {
    userId: string;
    roomId: string;
    action: 'ban' | 'mute' | 'unban' | 'unmute' | 'kick';
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
    action: 'ban' | 'mute' | 'unban' | 'unmute' | 'kick';
    roomId: string;
    onSuccess: () => void;
};

export function RestrictionAction({ isOpen, onClose, member, action, roomId, onSuccess }: RestrictionActionProps) {
    const { banUser, muteUser, unbanUser, unmuteUser, kickUser, loading } = useRestriction();
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
                userId: member.user._id,
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
            case 'ban': return <Ban size={20} />;
            case 'mute': return <MicOff size={20} />;
            case 'unban': return <CheckCircle size={20} />;
            case 'unmute': return <XCircle size={20} />;
            case 'kick': return <UserX size={20} />;
            default: return <AlertTriangle size={20} />;
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'ban': return 'danger';
            case 'mute': return 'warning';
            case 'unban': return 'success';
            case 'unmute': return 'success';
            case 'kick': return 'secondary';
            default: return 'default';
        }
    };

    const getActionTitle = (action: string) => {
        switch (action) {
            case 'ban': return 'Ban User';
            case 'mute': return 'Mute User';
            case 'unban': return 'Unban User';
            case 'unmute': return 'Unmute User';
            case 'kick': return 'Kick User';
            default: return 'Restrict User';
        }
    };

    const handleSubmit = async () => {
        try {
            if (!restrictionData.userId || !restrictionData.roomId) {
                addToast({
                    title: "Missing required information",
                    description: "Please fill in all required fields",
                    color: "warning",
                });
                return;
            }

            // For unban/unmute, reason is optional
            if ((action === 'ban' || action === 'mute' || action === 'kick') && !restrictionData.reason) {
                addToast({
                    title: "Missing required information",
                    description: "Please provide a reason",
                    color: "warning",
                });
                return;
            }

            if (action === 'ban') {
                await banUser(restrictionData);
            } else if (action === 'mute') {
                await muteUser(restrictionData);
            } else if (action === 'kick') {
                await kickUser(restrictionData);
            } else if (action === 'unban') {
                await unbanUser({ userId: restrictionData.userId, roomId: restrictionData.roomId });
            } else if (action === 'unmute') {
                await unmuteUser({ userId: restrictionData.userId, roomId: restrictionData.roomId });
            }

            addToast({
                title: `User ${action === 'ban' ? 'banned' : action === 'mute' ? 'muted' : action === 'kick' ? 'kicked' : action === 'unban' ? 'unbanned' : 'unmuted'} successfully!`,
                color: "success",
            });
            onSuccess();
        } catch (error) {
            addToast({
                title: `Error ${action === 'ban' ? 'banning' : action === 'mute' ? 'muting' : action === 'kick' ? 'kicking' : action === 'unban' ? 'unbanning' : 'unmuting'} user`,
                description: error instanceof Error ? error.message : `Failed to ${action} user`,
                color: "danger",
            });
        }
    };

    if (!member) return null;

    // Fallback logic for name
    const nameObj = member.user.name || { first: "", middle: "", last: "" };
    const fullName = [nameObj.first, nameObj.middle, nameObj.last].filter(Boolean).join(" ") || member.user.username || "";

    const isUnbanOrUnmute = action === 'unban' || action === 'unmute';
    const isKick = action === 'kick';

    return (
        <Modal isOpen={isOpen} size="2xl" onClose={onClose} scrollBehavior="inside">
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg bg-${getActionColor(action)}/10`}>
                            {getActionIcon(action)}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">{getActionTitle(action)}</h3>
                            <p className="text-sm text-default-500">Manage user restrictions in this room</p>
                        </div>
                    </div>
                </ModalHeader>
                <ModalBody>
                    {/* User Info Section */}
                    <div className="p-4 bg-default-50 rounded-lg mb-6">
                        <div className="flex items-center gap-3">
                            <Avatar 
                                name={fullName} 
                                size="md"
                                className="bg-primary text-white font-semibold"
                            />
                            <div className="flex-1">
                                <h4 className="font-semibold text-base">{member.user.username}</h4>
                                <p className="text-sm text-default-500">{fullName}</p>
                                {member.restrictionStatus && (
                                    <div className="flex gap-2 mt-2">
                                        {member.restrictionStatus.isBanned && (
                                            <Badge color="danger" size="sm" variant="flat">
                                                <Ban size={12} className="mr-1" />
                                                Banned
                                            </Badge>
                                        )}
                                        {member.restrictionStatus.isMuted && (
                                            <Badge color="warning" size="sm" variant="flat">
                                                <MicOff size={12} className="mr-1" />
                                                Muted
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {!isUnbanOrUnmute && !isKick && (
                        <>
                            {/* Duration Selection */}
                            <div className="mb-6">
                                <h4 className="text-sm font-medium mb-3">Duration</h4>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant={restrictionData.duration === 'temporary' ? 'solid' : 'bordered'}
                                        color="primary"
                                        onPress={() => setRestrictionData({ ...restrictionData, duration: 'temporary' as 'temporary' })}
                                        startContent={<Clock size={16} />}
                                    >
                                        Temporary
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={restrictionData.duration === 'permanent' ? 'solid' : 'bordered'}
                                        color="primary"
                                        onPress={() => setRestrictionData({ ...restrictionData, duration: 'permanent' as 'permanent' })}
                                    >
                                        Permanent
                                    </Button>
                                </div>
                            </div>

                            {/* Time Settings for Temporary */}
                            {restrictionData.duration === 'temporary' && (
                                <div className="mb-6">
                                    <h4 className="text-sm font-medium mb-3">Time Settings</h4>
                                    <div className="flex gap-3">
                                        <Input
                                            label="Duration"
                                            placeholder="15"
                                            type="number"
                                            size="sm"
                                            value={restrictionData.timeValue?.toString() || ''}
                                            onValueChange={(value) => setRestrictionData({ ...restrictionData, timeValue: parseInt(value) || 15 })}
                                            className="flex-1"
                                        />
                                        <Dropdown>
                                            <DropdownTrigger>
                                                <Button variant="bordered" size="sm" className="min-w-[120px]">
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
                                </div>
                            )}

                            {/* Mute Restriction Settings */}
                            {action === 'mute' && (
                                <div className="mb-6">
                                    <h4 className="text-sm font-medium mb-3">Message Visibility</h4>
                                    <Dropdown>
                                        <DropdownTrigger>
                                            <Button className="w-full justify-start" variant="bordered" size="sm">
                                                {restrictionData.restriction === 'can_view' ? 'Can View Messages' : 'Cannot View Messages'}
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
                                </div>
                            )}

                            <Divider />

                            {/* Reason Input */}
                            <div className="mt-6">
                                <h4 className="text-sm font-medium mb-3">Reason</h4>
                                <Textarea
                                    isRequired
                                    placeholder="Enter reason for this action..."
                                    value={restrictionData.reason}
                                    onValueChange={(value) => setRestrictionData({ ...restrictionData, reason: value })}
                                    minRows={3}
                                    maxRows={5}
                                />
                            </div>
                        </>
                    )}

                    {isKick && (
                        <>
                            <div className="text-center py-6">
                                <div className="p-3 rounded-full bg-warning/10 w-fit mx-auto mb-4">
                                    <UserX size={24} className="text-warning" />
                                </div>
                                <h4 className="text-lg font-semibold mb-2">Kick User from Room</h4>
                                <p className="text-sm text-default-600 mb-6">
                                    This will immediately remove the user from the room. They can rejoin if they have permission.
                                </p>
                            </div>
                            <Divider />
                            <div className="mt-6">
                                <h4 className="text-sm font-medium mb-3">Reason</h4>
                                <Textarea
                                    isRequired
                                    placeholder="Enter reason for kicking this user..."
                                    value={restrictionData.reason}
                                    onValueChange={(value) => setRestrictionData({ ...restrictionData, reason: value })}
                                    minRows={3}
                                    maxRows={5}
                                />
                            </div>
                        </>
                    )}

                    {isUnbanOrUnmute && (
                        <div className="text-center py-8">
                            <div className="p-3 rounded-full bg-success/10 w-fit mx-auto mb-4">
                                {action === 'unban' ? <CheckCircle size={24} className="text-success" /> : <XCircle size={24} className="text-success" />}
                            </div>
                            <h4 className="text-lg font-semibold mb-2">
                                {action === 'unban' ? 'Unban User' : 'Unmute User'}
                            </h4>
                            <p className="text-sm text-default-600">
                                This will remove all current restrictions for this user in this room.
                            </p>
                        </div>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button variant="light" onPress={onClose}>
                        Cancel
                    </Button>
                    <Button 
                        color={getActionColor(action) as any}
                        isDisabled={(!isUnbanOrUnmute && !isKick) && (!restrictionData.userId || !restrictionData.reason)}
                        isLoading={loading}
                        startContent={getActionIcon(action)}
                        onPress={handleSubmit}
                    >
                        {getActionTitle(action)}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
