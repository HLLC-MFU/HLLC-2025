import React, { Key } from "react";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react";
import { EllipsisVertical, Image } from "lucide-react";
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
                <span className="text-small text-small">EN: {evoucher.detail.en}</span>
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
                {evoucher.claims ? `${evoucher.claims.currentClaim || 0} / ${evoucher.claims.maxClaim || 0}` : '0 / 0'}
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
                {evoucher.photo?.coverPhoto ? (
                    <div className="w-full h-full">
                        <img
                    src={`http://localhost:8080/uploads/${evoucher.photo.coverPhoto}`}
                    alt={evoucher.sponsors.name.en}
                    className="h-full w-full object-contain rounded border border-default-300 bg-white mx-auto"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.png";
                    }}
                  />
                    </div>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-default-400">
                        <Image size={24} />
                        <span className="text-xs">No image uploaded</span>
                    </div>
                )}
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