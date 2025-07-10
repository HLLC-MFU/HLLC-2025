import { Button, Input } from "@heroui/react";
import { PlusIcon, SearchIcon } from "lucide-react";
import React from "react";

import { Sticker } from "@/types/sticker";

type StickerTopContentProps = {
    setActionText: () => void;
    filterValue: string;
    capitalize: (value: string) => string;
    filteredItems: Sticker[];
    page: number;
    pages: number;
    setPage: (page: number) => void;
    onPreviousPage: () => void;
    onNextPage: () => void;
    onClear: () => void;
    onSearchChange: (value: string) => void;
    placeholder?: string;
    showAddButton?: boolean;
}

export default function StickerTopContent({
    setActionText,
    filterValue,
    onClear,
    onSearchChange,
    placeholder = "Search stickers",
    showAddButton = true,
}: StickerTopContentProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between gap-3 items-end">
                <Input
                    isClearable
                    className="w-full sm:max-w-[44%]"
                    placeholder={placeholder}
                    startContent={<SearchIcon />}
                    value={filterValue}
                    onClear={onClear}
                    onValueChange={onSearchChange}
                />
                {showAddButton && (
                    <div className="flex gap-3">
                        <Button 
                            color="primary" 
                            endContent={<PlusIcon size={20} />} 
                            onPress={setActionText}
                        >
                            Add Sticker
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
} 