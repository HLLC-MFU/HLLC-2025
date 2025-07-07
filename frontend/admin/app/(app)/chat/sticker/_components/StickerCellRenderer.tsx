import React from "react";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@heroui/react";
import { EllipsisVertical, Image, Pen, Trash } from "lucide-react";

import { Sticker } from "@/types/sticker";

export type StickerColumnKey =
    | "image"
    | "nameEn"
    | "nameTh"
    | "actions";

type StickerCellRendererProps = {
    sticker: Sticker;
    columnKey: StickerColumnKey;
    onEdit: () => void;
    onDelete: () => void;
}

export default function StickerCellRenderer({
    sticker,
    columnKey,
    onEdit,
    onDelete
}: StickerCellRendererProps) {
    switch (columnKey) {
        case "image":
            const imageUrl = sticker.image
                ? `${process.env.NEXT_PUBLIC_DEPLOY_GO_API_URL}/uploads/${sticker.image}`
                : '';

            return (
                <div className="flex items-center justify-center w-full">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-default-200 bg-default-100 flex items-center justify-center">
                        {sticker.image ? (
                            <img
                                alt={sticker.name.en}
                                className="h-full w-full object-contain transition-transform duration-200 hover:scale-105"
                                src={imageUrl}
                                onError={(e) => { e.currentTarget.src = "/placeholder.png"; }}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center w-full h-full">
                                <Image className="text-default-300" size={28} />
                                <span className="text-xs text-default-400">No image</span>
                            </div>
                        )}
                    </div>
                </div>
            );

        case "nameEn":
            return (
                <div className="flex items-center min-w-[120px]">
                    <p className="text-sm font-medium capitalize truncate">
                        {sticker.name.en}
                    </p>
                </div>
            );

        case "nameTh":
            return (
                <div className="flex items-center min-w-[120px]">
                    <p className="text-sm font-medium capitalize truncate">
                        {sticker.name.th}
                    </p>
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