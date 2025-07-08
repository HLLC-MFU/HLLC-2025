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
    Divider,
    addToast
} from "@heroui/react";
import { Shield, LogOut } from "lucide-react";
import { useState } from "react";
import { useRestriction } from "../_hooks/useRestriction";

type MemberModalProps ={
    isOpen: boolean;
    onClose: () => void;
    member: RoomMember | null;
    roomId: string;
    onMemberKicked?: () => void;
};

export function MemberModal({ isOpen, onClose, member, roomId, onMemberKicked }: MemberModalProps) {
    const { kickUser } = useRestriction();
    const [isKicking, setIsKicking] = useState(false);

    if (!member) return null;

    // Fallback logic for name
    const nameObj = member.name || {};
    const fullName = [nameObj.first, nameObj.middle, nameObj.last].filter(Boolean).join(" ") || member.username || "";

    // Kick handler
    const handleKick = async () => {
        setIsKicking(true);
        try {
            await kickUser({
                roomId,
                userId: member._id,
                action: "kick",
                reason: "Kicked by admin"
            });
            if (onMemberKicked) {
                onMemberKicked();
            }
            addToast({ title: "User kicked successfully!", color: "success" });
            onClose();
        } catch (error) {
            addToast({ title: "Failed to kick user", color: "danger" });
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
                        onPress={handleKick}
                        isLoading={isKicking}
                    >
                        Kick User
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
