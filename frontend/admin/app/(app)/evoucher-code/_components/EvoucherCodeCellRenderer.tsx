import React, { Key } from "react";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Chip } from "@heroui/react";
import { EllipsisVertical, Copy } from "lucide-react";
import { EvoucherCode, EvoucherCodeStatus } from "@/types/evoucher-code";

interface EvoucherCodeCellRendererProps {
    evoucherCode: EvoucherCode;
    columnKey: Key;
    onEdit: () => void;
    onDelete: () => void;
}

export default function EvoucherCodeCellRenderer({ 
    evoucherCode, 
    columnKey, 
    onEdit, 
    onDelete 
}: EvoucherCodeCellRendererProps) {
    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
    };

    const getStatusColor = (status: EvoucherCodeStatus) => {
        switch (status) {
            case EvoucherCodeStatus.ACTIVE:
                return "success";
            case EvoucherCodeStatus.USED:
                return "warning";
            case EvoucherCodeStatus.INACTIVE:
                return "danger";
            default:
                return "default";
        }
    };

    const cellRenderers: Record<string, React.ReactNode> = {
        code: (
            <div className="flex items-center gap-2">
                <span className="font-mono">{evoucherCode.code}</span>
                <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onClick={() => handleCopyCode(evoucherCode.code)}
                >
                    <Copy className="h-4 w-4" />
                </Button>
            </div>
        ),
        evoucher: (
            <span className="text-bold text-small">
                {evoucherCode.evoucher.acronym}
            </span>
        ),
        status: (
            <Chip color={getStatusColor(evoucherCode.status)} size="sm">
                {evoucherCode.status}
            </Chip>
        ),
        usedBy: (
            <span className="text-bold text-small">
                {evoucherCode.usedBy || "-"}
            </span>
        ),
        usedAt: (
            <span className="text-bold text-small">
                {evoucherCode.usedAt ? new Date(evoucherCode.usedAt).toLocaleString() : "-"}
            </span>
        ),
        createdAt: (
            <span className="text-bold text-small">
                {new Date(evoucherCode.createdAt).toLocaleString()}
            </span>
        ),
        actions: (
            <div className="relative flex justify-end items-center gap-2">
                <Dropdown>
                    <DropdownTrigger>
                        <Button isIconOnly size="sm" variant="light">
                            <EllipsisVertical className="text-default-300" />
                        </Button>
                    </DropdownTrigger>
                    <DropdownMenu>
                        <DropdownItem key="edit" onPress={onEdit}>
                            Edit
                        </DropdownItem>
                        <DropdownItem key="delete" onPress={onDelete}>
                            Delete
                        </DropdownItem>
                    </DropdownMenu>
                </Dropdown>
            </div>
        )
    };

    return (
        <div className="flex flex-col">
            {cellRenderers[columnKey.toString()] || ""}
        </div>
    );
} 