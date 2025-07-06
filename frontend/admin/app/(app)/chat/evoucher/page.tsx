"use client";

import { PageHeader } from "@/components/ui/page-header";
import { useChat } from "@/hooks/useChat";
import { EvoucherData } from "@/types/chat";
import { 
    Card, 
    CardBody, 
    Button, 
    Input,
    Textarea,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Chip,
    Avatar,
    Table, 
    TableHeader, 
    TableColumn, 
    TableBody, 
    TableRow, 
    TableCell,
} from "@heroui/react";
import { 
    ArrowLeft, 
    Gift, 
    Users, 
    Send,
    CheckCircle,
    XCircle
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { addToast } from "@heroui/react";

export default function EvoucherPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const roomId = searchParams.get('roomId');
    
    const { getRoomMembers, sendEvoucher, loading } = useChat();

    const [members, setMembers] = useState<any[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [evoucherData, setEvoucherData] = useState({
        roomId: roomId || '',
        userIds: [] as string[],
        evoucherId: '',
        message: ''
    });
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);

    useEffect(() => {
        if (roomId) {
            loadMembers();
        }
    }, [roomId]);

    const loadMembers = async () => {
        try {
            setIsLoadingMembers(true);
            const roomMembers = await getRoomMembers(roomId!);
            setMembers(roomMembers);
        } catch (error) {
            addToast({
                title: "Error loading members",
                description: error instanceof Error ? error.message : "Failed to load room members",
                color: "danger",
            });
        } finally {
            setIsLoadingMembers(false);
        }
    };

    const handleMemberToggle = (userId: string) => {
        setSelectedMembers(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSelectAll = () => {
        if (selectedMembers.length === members.length) {
            setSelectedMembers([]);
        } else {
            setSelectedMembers(members.map(member => member._id));
        }
    };

    const handleSendEvoucher = async () => {
        if (!evoucherData.evoucherId || selectedMembers.length === 0) {
            addToast({
                title: "Missing information",
                description: "Please select an evoucher and at least one member",
                color: "warning",
            });
            return;
        }

        try {
            const data = {
                ...evoucherData,
                userIds: selectedMembers
            };
            
            await sendEvoucher(data as unknown as EvoucherData);
            
            addToast({
                title: "Evoucher sent successfully!",
                color: "success",
            });
            
            // Reset form
            setSelectedMembers([]);
            setEvoucherData({
                roomId: roomId || '',
                userIds: [],
                evoucherId: '',
                message: ''
            });
        } catch (error) {
            addToast({
                title: "Error sending evoucher",
                description: error instanceof Error ? error.message : "Failed to send evoucher",
                color: "danger",
            });
        }
    };

    if (isLoadingMembers) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-2">
                        <div className="h-8 w-48 bg-default-200 rounded-lg animate-pulse" />
                        <div className="h-4 w-32 bg-default-200 rounded-lg animate-pulse" />
                    </div>
                    <div className="h-10 w-32 bg-default-200 rounded-lg animate-pulse" />
                </div>
                <Card>
                    <CardBody>
                        <div className="space-y-4">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <div key={index} className="h-16 bg-default-200 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <PageHeader 
                description="Send evouchers to room members"
                icon={<Gift />}
                title="Send Evoucher"
                right={
                    <Button
                        variant="light"
                        startContent={<ArrowLeft size={20} />}
                        onPress={() => router.back()}
                    >
                        Back
                    </Button>
                }
            />

            {/* Evoucher Form */}
            <Card>
                <CardBody>
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-4">
                            <Input
                                label="Evoucher ID"
                                placeholder="Enter evoucher ID"
                                    value={evoucherData.evoucherId}
                                onValueChange={(value) => setEvoucherData({...evoucherData, evoucherId: value})}
                                className="flex-1"
                            />
                            <Button
                                color="primary"
                                startContent={<Send size={20} />}
                                onPress={handleSendEvoucher}
                                isLoading={loading}
                                isDisabled={!evoucherData.evoucherId || selectedMembers.length === 0}
                            >
                                Send to {selectedMembers.length} Members
                            </Button>
                        </div>
                        
                        <Textarea
                            label="Message (Optional)"
                            placeholder="Enter a message to include with the evoucher"
                            value={evoucherData.message}
                            onValueChange={(value) => setEvoucherData({...evoucherData, message: value})}
                        />
                    </div>
                </CardBody>
            </Card>

            {/* Members Selection */}
            <Card>
                <CardBody>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Select Members</h3>
                        <div className="flex items-center gap-2">
                            <Chip color="primary" variant="flat">
                                {selectedMembers.length} selected
                            </Chip>
                            <Button
                                size="sm"
                                variant="light"
                                onPress={handleSelectAll}
                            >
                                {selectedMembers.length === members.length ? 'Deselect All' : 'Select All'}
                            </Button>
                        </div>
                    </div>

                    <Table aria-label="Members selection table">
                        <TableHeader>
                            <TableColumn>SELECT</TableColumn>
                            <TableColumn>USER</TableColumn>
                            <TableColumn>ROLE</TableColumn>
                            <TableColumn>STATUS</TableColumn>
                        </TableHeader>
                        <TableBody emptyContent="No members found">
                            {members.map((member) => (
                                <TableRow key={member._id}>
                                    <TableCell>
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            color={selectedMembers.includes(member._id) ? "primary" : "default"}
                                            onPress={() => handleMemberToggle(member._id)}
                                        >
                                            {selectedMembers.includes(member._id) ? (
                                                <CheckCircle size={16} />
                                            ) : (
                                                <XCircle size={16} />
                                            )}
                                        </Button>
                                    </TableCell>
                                    <TableCell>
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
                                                            <p className="font-semibold">{member.username}</p>
                                                            <p className="text-small text-default-500">
                                                                {fullName}
                                                            </p>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Chip size="sm" variant="flat">
                                            {member.role.name}
                                        </Chip>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            size="sm"
                                            color={member.isOnline ? "success" : "default"}
                                            variant="flat"
                                        >
                                            {member.isOnline ? "Online" : "Offline"}
                                        </Chip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>
        </div>
    );
} 