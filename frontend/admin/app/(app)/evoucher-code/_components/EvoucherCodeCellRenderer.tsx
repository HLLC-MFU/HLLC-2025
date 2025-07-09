import React, { Key } from "react";
import {
    Button,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
} from "@heroui/react";
import { EllipsisVertical, Pen, Trash } from "lucide-react";

import { EvoucherCode } from "@/types/evoucher-code";

type EvoucherCodeCellRendererProps = {
    evoucherCode: EvoucherCode;
    columnKey: Key;
    onEdit: () => void;
    onDelete: () => void;
}

export default function EvoucherCodeCellRenderer({
    evoucherCode,
    columnKey,
    onEdit,
    onDelete,
}: EvoucherCodeCellRendererProps) {
    const evoucherObj =
        typeof evoucherCode.evoucher === "object" ? evoucherCode.evoucher : null;
    const sponsorObj =
        evoucherObj && typeof evoucherObj.sponsors === "object"
            ? evoucherObj.sponsors
            : null;
    const userObj =
        typeof evoucherCode.user === "object" ? evoucherCode.user : null;

    const cellRenderers: Record<string, React.ReactNode> = {
        code: (
            <span className="text-bold text-small">
                {evoucherCode.code}
            </span>
        ),
        evoucher: (
            <div className="flex flex-col gap-1 min-w-[180px] max-w-[250px]">
                <span className="text-bold text-small truncate">
                    {evoucherObj?.discount || ""}
                </span>
            </div>
        ),
        sponsor: (
            <div className="flex flex-col gap-1 min-w-[180px] max-w-[250px]">
                <span className="text-bold text-small truncate">
                    {sponsorObj?.name?.en || ""}
                </span>
                <span className="text-small text-default-500 truncate">
                    {sponsorObj?.name?.th || ""}
                </span>
            </div>
        ),
        isUsed: (
            <div className="flex flex-col gap-1 min-w-[180px] max-w-[250px]">
                <span
                    className={`text-bold text-small capitalize truncate ${evoucherCode.isUsed ? "text-danger" : "text-success"
                        }`}
                >
                    {evoucherCode.isUsed ? "Used" : "Available"}
                </span>
            </div>
        ),
        expiration: (
            <div className="flex flex-col gap-1 min-w-[180px] max-w-[250px]">
                {evoucherObj?.expiration ? (
                    new Date(evoucherObj.expiration).toLocaleString("en-US", {
                        dateStyle: "long",
                        timeStyle: "short",
                        timeZone: "UTC",
                    })
                ) : (
                    <span className="text-default-400">No expiration date</span>
                )}
            </div>
        ),
        user: (
            <div className="flex flex-col gap-1 min-w-[180px] max-w-[250px]">
                <span className="text-bold text-small truncate">
                    {userObj?.username || ""}
                </span>
            </div>
        ),
        actions: (
            <div className="relative flex justify-end items-center gap-2 w-[60px]">
                <Dropdown>
                    <DropdownTrigger>
                        <Button isIconOnly size="sm" variant="light">
                            <EllipsisVertical className="text-default-300" />
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
        ),
    };

    return (
        <div className="flex flex-col">
            {cellRenderers[columnKey.toString()] || ""}
        </div>
    );
}
