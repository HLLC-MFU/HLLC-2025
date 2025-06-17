import React, { Key } from "react";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react";
import { EllipsisVertical } from "lucide-react";
import { EvoucherCode } from "@/types/evoucher-code";

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
    const cellRenderers: Record<string, React.ReactNode> = {
        code: (
            <span className="text-bold text-small">
                {evoucherCode.code}
            </span>
        ),
        evoucher: (
            <div className="flex flex-col gap-1">
                <span className="text-bold text-small">{evoucherCode.evoucher.acronym}</span>
                <span className="text-small text-default-500">{evoucherCode.evoucher.detail.en}</span>
            </div>
        ),
        sponsor: (
            <span className="text-bold text-small capitalize">
                {evoucherCode.evoucher.sponsors.name.en}
            </span>
        ),
        isUsed: (
            <span className={`text-bold text-small capitalize ${
                evoucherCode.isUsed ? 'text-danger' : 'text-success'
            }`}>
                {evoucherCode.isUsed ? 'Used' : 'Available'}
            </span>
        ),
        expiration: (
            <span className="text-bold text-small">
                {new Date(evoucherCode.metadata.expiration).toLocaleString("en-US", {
                    dateStyle: 'long',
                    timeStyle: 'short',
                    timeZone: 'UTC'
                })}
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