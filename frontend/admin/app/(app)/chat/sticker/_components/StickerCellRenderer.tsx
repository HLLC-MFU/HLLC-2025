import React, { useState } from "react";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Image } from "@heroui/react";
import { EllipsisVertical, Image as ImageIcon, Pen, Trash } from "lucide-react";

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
    const [imageError, setImageError] = useState(false);

    const getImageUrl = () => {
        if (sticker.image && !imageError) {
            return `${process.env.NEXT_PUBLIC_GO_IMAGE_URL}/uploads/${sticker.image}`;
        }
        
        const fallbackName = sticker.name?.en || sticker.name?.th || 'S';
        return `https://ui-avatars.com/api/?name=${fallbackName.charAt(0).toUpperCase()}&background=6366f1&color=fff&size=48&font-size=0.4`;
    };

    const getDisplayName = (lang: 'en' | 'th') => {
        return sticker.name?.[lang] || 'N/A';
    };

    switch (columnKey) {
        case "image":
            return (
                <div className="flex items-center justify-center w-full">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-default-200 bg-default-100 flex items-center justify-center">
                        {sticker.image && !imageError ? (
                            <Image
                                alt={getDisplayName('en')}
                                className="h-full w-full object-contain transition-transform duration-200 hover:scale-105"
                                src={getImageUrl()}
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center w-full h-full">
                                <ImageIcon className="text-default-300" size={28} />
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
                        {getDisplayName('en')}
                    </p>
                </div>
            );

        case "nameTh":
            return (
                <div className="flex items-center min-w-[120px]">
                    <p className="text-sm font-medium capitalize truncate">
                        {getDisplayName('th')}
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