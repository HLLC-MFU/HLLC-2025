import React, { Key } from "react";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Image } from "@heroui/react";
import { EllipsisVertical } from "lucide-react";
import { Evoucher } from "@/types/evoucher/d";

interface EvoucherCellRendererProps {
    evoucher: Evoucher;
    columnKey: Key;
    onEdit: () => void;
    onDelete: () => void;
}

export default function EvoucherCellRenderer({ 
    evoucher, 
    columnKey, 
    onEdit, 
    onDelete 
}: EvoucherCellRendererProps) {
    const cellRenderers: Record<string, React.ReactNode> = {
        sponsors: (
            <span className="text-bold text-small capitalize">
                {evoucher.sponsors.name.en}
            </span>
        ),
        discount: (
            <span className="text-bold text-small">
                {evoucher.discount}%
            </span>
        ),
        acronym: (
            <span className="text-bold text-small">
                {evoucher.acronym}
            </span>
        ),
        detail: (
            <div className="flex flex-col gap-1">
                <span className="text-bold text-small">TH: {evoucher.detail.th}</span>
                <span className="text-small text-default-400">EN: {evoucher.detail.en}</span>
            </div>
        ),
        status: (
            <span className={`text-bold text-small capitalize ${
                evoucher.status === 'ACTIVE' ? 'text-success' : 'text-danger'
            }`}>
                {evoucher.status}
            </span>
        ),
        claims: (
            <span className="text-bold text-small">
                {evoucher.claims.currentClaim} / {evoucher.claims.maxClaim}
            </span>
        ),
        expiration: (
            <span className="text-bold text-small">
                {new Date(evoucher.expiration).toLocaleString("en-US", {
                    dateStyle: 'long',
                    timeStyle: 'short',
                    timeZone: 'UTC'
                })}
            </span>
        ),
        cover: (
            <div className="relative w-[100px] h-[100px] rounded-lg overflow-hidden border border-default-200">
                <Image
                    src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${evoucher.photo?.coverPhoto}`}
                    alt="Cover"
                    width={100}
                    height={100}
                    className="object-cover w-full h-full hover:scale-110 transition-transform duration-200"
                />
            </div>
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