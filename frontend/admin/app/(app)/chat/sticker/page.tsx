"use client";

import { PageHeader } from "@/components/ui/page-header";
import { useChat } from "@/hooks/useChat";
import { 
    Card, 
    CardBody, 
    Button, 
    Input,
    Textarea,
    Chip,
    Avatar,
    Table, 
    TableHeader, 
    TableColumn, 
    TableBody, 
    TableRow, 
    TableCell,
    Image
} from "@heroui/react";
import { 
    ArrowLeft, 
    Sticker, 
    Users, 
    Send,
    CheckCircle,
    XCircle,
    Image as ImageIcon
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { addToast } from "@heroui/react";

export default function StickerPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const roomId = searchParams.get('roomId');
    
    const { getRoomMembers, loading } = useChat();

    const [members, setMembers] = useState<any[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [stickerData, setStickerData] = useState({
        roomId: roomId || '',
        userIds: [] as string[],
        stickerUrl: '',
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

    const handleSendSticker = async () => {
        if (!stickerData.stickerUrl || selectedMembers.length === 0) {
            addToast({
                title: "Missing information",
                description: "Please provide a sticker URL and select at least one member",
                color: "warning",
            });
            return;
        }

        try {
            // TODO: Implement sticker sending API call
            addToast({
                title: "Sticker sent successfully!",
                color: "success",
            });
            
            // Reset form
            setSelectedMembers([]);
            setStickerData({
                roomId: roomId || '',
                userIds: [],
                stickerUrl: '',
                message: ''
            });
        } catch (error) {
            addToast({
                title: "Error sending sticker",
                description: error instanceof Error ? error.message : "Failed to send sticker",
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
                description="Send stickers to room members"
                icon={<Sticker />}
                title="Send Sticker"
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

            {/* Sticker Form */}
            <Card>
                <CardBody>
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-4">
                            <Input
                                label="Sticker URL"
                                placeholder="Enter sticker image URL"
                                value={stickerData.stickerUrl}
                                onValueChange={(value) => setStickerData({...stickerData, stickerUrl: value})}
                                className="flex-1"
                                startContent={<ImageIcon size={20} />}
                            />
                            <Button
                                color="secondary"
                                startContent={<Send size={20} />}
                                onPress={handleSendSticker}
                                isLoading={loading}
                                isDisabled={!stickerData.stickerUrl || selectedMembers.length === 0}
                            >
                                Send to {selectedMembers.length} Members
                            </Button>
                        </div>
                        
                        {stickerData.stickerUrl && (
                            <div className="flex items-center gap-2">
                                <ImageIcon size={20} className="text-default-400" />
                                <span className="text-sm text-default-500">Preview:</span>
                                <Image
                                    src={stickerData.stickerUrl}
                                    alt="Sticker preview"
                                    className="w-16 h-16 object-contain rounded-lg border"
                                    fallbackSrc="https://via.placeholder.com/64x64?text=Sticker"
                                />
                            </div>
                        )}
                        
                        <Textarea
                            label="Message (Optional)"
                            placeholder="Enter a message to include with the sticker"
                            value={stickerData.message}
                            onValueChange={(value) => setStickerData({...stickerData, message: value})}
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
                            <Chip color="secondary" variant="flat">
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
                                            color={selectedMembers.includes(member._id) ? "secondary" : "default"}
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
                                            <Avatar
                                                name={`${member.name.first} ${member.name.last}`}
                                                size="sm"
                                            />
                                            <div>
                                                <p className="font-semibold">{member.username}</p>
                                                <p className="text-small text-default-500">
                                                    {member.name.first} {member.name.last}
                                                </p>
                                            </div>
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