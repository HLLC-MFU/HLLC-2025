import React, { Key } from "react";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react";
import { EllipsisVertical, Image, Pen, Trash } from "lucide-react";
import { Evoucher } from "@/types/evoucher";

export type EvoucherColumnKey =
    | "sponsors"
    | "discount"
    | "acronym"
    | "detail"
    | "status"
    | "claims"
    | "expiration"
    | "cover"
    | "actions";

type EvoucherCellRendererProps = {
    evoucher: Evoucher;
    columnKey: EvoucherColumnKey;
    onEdit: () => void;
    onDelete: () => void;
}

export default function EvoucherCellRenderer({
    evoucher,
    columnKey,
    onEdit,
    onDelete
}: EvoucherCellRendererProps) {
    switch (columnKey) {
        case "sponsors":
            return (
                <div className="flex items-center min-w-[120px]">
                    <p className="text-sm font-medium capitalize truncate">
                        {evoucher.sponsors.name.en}
                    </p>
                </div>
            );

        case "discount":
            return (
                <div className="flex items-center justify-start min-w-[80px]">
                    <p className="text-sm font-medium">
                        {evoucher.discount}
                    </p>
                </div>
            );

        case "acronym":
            return (
                <div className="flex items-center min-w-[100px]">
                    <p className="text-sm font-medium truncate">
                        {evoucher.acronym}
                    </p>
                </div>
            );

        case "detail":
            return (
                <div className="flex flex-col gap-1 min-w-[180px] max-w-[250px]">
                    <div className="flex items-start gap-2">
                        <span className="text-xs text-default-400 shrink-0">TH:</span>
                        <p className="text-sm truncate">{evoucher.detail.th}</p>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="text-xs text-default-400 shrink-0">EN:</span>
                        <p className="text-sm truncate">{evoucher.detail.en}</p>
                    </div>
                </div>
            );

        case "status":
            return (
                <div className="flex items-center min-w-[90px]">
                    <span className={`text-sm font-medium capitalize px-2 py-1 rounded-full ${evoucher.status === "ACTIVE"
                        ? "bg-success/10 text-success"
                        : "bg-danger/10 text-danger"
                        }`}>
                        {evoucher.status.toLowerCase()}
                    </span>
                </div>
            );

        case "claims":
            return (
                <div className="flex items-center justify-start min-w-[80px]">
                    <p className="text-sm font-medium">
                        {evoucher.claims?.maxClaim
                            ? `${evoucher.claims.currentClaim || 0} / ${evoucher.claims.maxClaim}`
                            : "-"}
                    </p>
                </div>
            );

        case "expiration":
            return (
                <div className="flex items-center min-w-[180px]">
                    <p className="text-sm font-medium whitespace-nowrap">
                        {new Date(evoucher.expiration).toLocaleString("en-US", {
                            dateStyle: "long",
                            timeStyle: "short",
                            timeZone: "UTC"
                        })}
                    </p>
                </div>
            );

        case "cover":
            return (
                <div className="flex items-center justify-center w-[100px] mx-auto">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-default-200">
                        {evoucher.photo?.coverPhoto ? (
                            <img
                                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${evoucher.photo.coverPhoto}`}
                                alt={evoucher.sponsors.name.en}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.src = "/placeholder.png";
                                }}
                            />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-default-50">
                                <Image className="text-default-400" size={18} />
                                <span className="text-[10px] text-default-400">No image</span>
                            </div>
                        )}
                    </div>
                </div>
            );

        case "actions":
            return (
                <div className="flex items-center justify-center w-[60px]">
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <EllipsisVertical className="text-default-400" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu>
                            <DropdownItem
                                key="edit"
                                startContent={<Pen size={16} />}
                                onPress={onEdit}
                            >
                                Edit
                            </DropdownItem>
                            <DropdownItem
                                key="delete"
                                className="text-danger"
                                color="danger"
                                startContent={<Trash size={16} />}
                                onPress={onDelete}
                            >
                                Delete
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </div>
            );

        default:
            return null;
    }
}