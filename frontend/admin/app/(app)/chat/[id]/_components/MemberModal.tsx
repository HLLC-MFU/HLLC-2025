"use client";

import { RoomMember } from "@/types/chat";
import { 
    Modal, 
    ModalContent, 
    ModalHeader, 
    ModalBody, 
    ModalFooter,
    Button,
    Avatar,
    Chip,
    Divider
} from "@heroui/react";
import { Shield, LogOut } from "lucide-react";
import { useState } from "react";
import { addToast } from "@heroui/toast";
import { getToken } from "@/utils/storage";

type MemberModalProps ={
    isOpen: boolean;
    onClose: () => void;
    member: RoomMember | null;
    roomId?: string;
    onMemberKicked?: () => void;
};

export function MemberModal({ isOpen, onClose, member, roomId, onMemberKicked }: MemberModalProps) {
    const [isKicking, setIsKicking] = useState(false);

    if (!member) return null;

    // Fallback logic for name
    const nameObj = member.name || {};
    const fullName = [nameObj.first, nameObj.middle, nameObj.last].filter(Boolean).join(" ") || member.username || "";

    const handleKickUser = async () => {
        if (!roomId || !member._id) return;

        if (!confirm(`Are you sure you want to kick ${member.username} from this room?`)) {
            return;
        }

        try {
            setIsKicking(true);
            const token = getToken('accessToken');
            const response = await fetch('/restriction/kick', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    userId: member._id,
                    roomId: roomId,
                    reason: 'Kicked by administrator'
                }),
            });

            const result = await response.json();

            if (result.success) {
                addToast({
                    title: "User kicked successfully",
                    description: `${member.username} has been kicked from the room`,
                    color: "success",
                });
                onMemberKicked?.();
                onClose();
            } else {
                throw new Error(result.message || 'Failed to kick user');
            }
        } catch (error) {
            addToast({
                title: "Error kicking user",
                description: error instanceof Error ? error.message : "Failed to kick user",
                color: "danger",
            });
        } finally {
            setIsKicking(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalContent>
                <ModalHeader>Member Profile</ModalHeader>
                <ModalBody>
                    <div className="flex flex-col gap-6">
                        {/* User Info */}
                        <div className="flex items-center gap-4">
                            <Avatar
                                name={fullName}
                                size="lg"
                            />
                            <div>
                                <h3 className="text-xl font-semibold">{member.username}</h3>
                                <p className="text-default-500">
                                    {fullName}
                                </p>
                            </div>
                        </div>

                        <Divider />

                        {/* Details */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Shield size={20} className="text-default-400" />
                                <div>
                                    <p className="text-sm text-default-500">Role</p>
                                    <Chip size="sm" variant="flat">
                                        {member.role?.name || 'User'}
                                    </Chip>
                                </div>
                            </div>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button variant="light" onPress={onClose}>
                        Close
                    </Button>
                    <Button
                        color="danger"
                        variant="flat"
                        startContent={<LogOut size={16} />}
                        onPress={handleKickUser}
                        isLoading={isKicking}
                    >
                        Kick User
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
