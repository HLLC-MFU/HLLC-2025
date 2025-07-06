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
import { User, Calendar, Clock, Shield } from "lucide-react";

interface MemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    member: RoomMember | null;
}

export function MemberModal({ isOpen, onClose, member }: MemberModalProps) {
    if (!member) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalContent>
                <ModalHeader>Member Profile</ModalHeader>
                <ModalBody>
                    <div className="flex flex-col gap-6">
                        {/* User Info */}
                        <div className="flex items-center gap-4">
                            <Avatar
                                name={`${member.name.first} ${member.name.last}`}
                                size="lg"
                            />
                            <div>
                                <h3 className="text-xl font-semibold">{member.username}</h3>
                                <p className="text-default-500">
                                    {member.name.first} {member.name.last}
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
                                        {member.role.name}
                                    </Chip>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Calendar size={20} className="text-default-400" />
                                <div>
                                    <p className="text-sm text-default-500">Joined</p>
                                    <p className="font-medium">
                                        {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {member.lastSeen && (
                                <div className="flex items-center gap-3">
                                    <Clock size={20} className="text-default-400" />
                                    <div>
                                        <p className="text-sm text-default-500">Last Seen</p>
                                        <p className="font-medium">
                                            {new Date(member.lastSeen).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button variant="light" onPress={onClose}>
                        Close
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
