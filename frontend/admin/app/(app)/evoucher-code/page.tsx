"use client"

import React, { useState } from "react";
import {
    Button,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Tooltip,
    useDisclosure,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Select,
    SelectItem,
    toast,
} from "@heroui/react";
import { PageHeader } from "@/components/ui/page-header";
import { Plus, Copy, RefreshCw, Trash2, Check } from "lucide-react";
import { EvoucherCode, EvoucherCodeStatus } from "@/types/evoucher-code";
import { useEvoucherCode } from "@/hooks/useEvoucherCode";
import { useEvoucher } from "@/hooks/useEvoucher";
import { Toast } from "@heroui/react";

export default function EvoucherCodePage() {
    const { codes, loading, generateCode, useCode, deleteCode } = useEvoucherCode();
    const { evouchers } = useEvoucher();
    const [selectedCode, setSelectedCode] = useState<EvoucherCode | null>(null);
    const [selectedEvoucher, setSelectedEvoucher] = useState<string>("");
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [modalType, setModalType] = useState<"use" | "delete">("use");

    const handleGenerateCode = async () => {
        if (!selectedEvoucher) return;
        
        try {
            await generateCode(selectedEvoucher);
            toast.success("Code generated successfully");
            setSelectedEvoucher("");
        } catch (error) {
            console.error("Error generating code:", error);
            Toast.error("Failed to generate code");
        }
    };

    const handleUseCode = async () => {
        if (!selectedCode) return;
        
        try {
            await useCode(selectedCode._id);
            Toast.success("Code used successfully");
            onClose();
        } catch (error) {
            console.error("Error using code:", error);
            Toast.error("Failed to use code");
        }
    };

    const handleDeleteCode = async () => {
        if (!selectedCode) return;
        
        try {
            await deleteCode(selectedCode._id);
            Toast.success("Code deleted successfully");
            onClose();
        } catch (error) {
            console.error("Error deleting code:", error);
            Toast.error("Failed to delete code");
        }
    };

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        Toast.success("Code copied to clipboard");
    };

    const getStatusColor = (status: EvoucherCodeStatus) => {
        switch (status) {
            case "ACTIVE":
                return "success";
            case "USED":
                return "warning";
            case "EXPIRED":
                return "danger";
            default:
                return "default";
        }
    };

    return (
        <>
            <PageHeader 
                description='Manage evoucher codes' 
                icon={<Check />} 
            />
            
            <div className="flex flex-col min-h-screen">
                <div className="container mx-auto">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex gap-4">
                            <Select
                                label="Select Evoucher"
                                placeholder="Choose an evoucher"
                                selectedKeys={[selectedEvoucher]}
                                onChange={(e) => setSelectedEvoucher(e.target.value)}
                                className="max-w-xs"
                            >
                                {evouchers.map((evoucher) => (
                                    <SelectItem key={evoucher._id} value={evoucher._id}>
                                        {evoucher.name}
                                    </SelectItem>
                                ))}
                            </Select>
                            <Button
                                color="primary"
                                endContent={<Plus />}
                                onPress={handleGenerateCode}
                                isDisabled={!selectedEvoucher}
                            >
                                Generate Code
                            </Button>
                        </div>
                    </div>

                    <Table aria-label="Evoucher codes table">
                        <TableHeader>
                            <TableColumn>CODE</TableColumn>
                            <TableColumn>EVOUCHER</TableColumn>
                            <TableColumn>STATUS</TableColumn>
                            <TableColumn>CREATED AT</TableColumn>
                            <TableColumn>USED AT</TableColumn>
                            <TableColumn>ACTIONS</TableColumn>
                        </TableHeader>
                        <TableBody>
                            {codes.map((code) => (
                                <TableRow key={code._id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono">{code.code}</span>
                                            <Tooltip content="Copy code">
                                                <Button
                                                    isIconOnly
                                                    variant="light"
                                                    size="sm"
                                                    onClick={() => handleCopyCode(code.code)}
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </Tooltip>
                                        </div>
                                    </TableCell>
                                    <TableCell>{code.evoucher?.name}</TableCell>
                                    <TableCell>
                                        <Chip color={getStatusColor(code.status)}>
                                            {code.status}
                                        </Chip>
                                    </TableCell>
                                    <TableCell>{code.createdAt}</TableCell>
                                    <TableCell>{code.usedAt ? code.usedAt : "-"}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            {code.status === "ACTIVE" && (
                                                <Tooltip content="Use code">
                                                    <Button
                                                        isIconOnly
                                                        color="primary"
                                                        variant="light"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedCode(code);
                                                            setModalType("use");
                                                            onOpen();
                                                        }}
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                </Tooltip>
                                            )}
                                            <Tooltip content="Delete code">
                                                <Button
                                                    isIconOnly
                                                    color="danger"
                                                    variant="light"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedCode(code);
                                                        setModalType("delete");
                                                        onOpen();
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </Tooltip>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalContent>
                    <ModalHeader>
                        {modalType === "use" ? "Use Code" : "Delete Code"}
                    </ModalHeader>
                    <ModalBody>
                        {modalType === "use" ? (
                            <p>Are you sure you want to use this code? This action cannot be undone.</p>
                        ) : (
                            <p>Are you sure you want to delete this code? This action cannot be undone.</p>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="light" onPress={onClose}>
                            Cancel
                        </Button>
                        {modalType === "use" ? (
                            <Button
                                color="primary"
                                onPress={handleUseCode}
                                isLoading={loading}
                            >
                                Use Code
                            </Button>
                        ) : (
                            <Button
                                color="danger"
                                onPress={handleDeleteCode}
                                isLoading={loading}
                            >
                                Delete
                            </Button>
                        )}
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    )
} 