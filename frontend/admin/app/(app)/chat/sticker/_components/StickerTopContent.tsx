import { Sticker } from "@/types/sticker";
import { Button, Input } from "@heroui/react";
import { PlusIcon, SearchIcon } from "lucide-react";
import React from "react";

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
}

export default function StickerTopContent({
    setActionText,
    filterValue,
    onClear,
    onSearchChange,
}: StickerTopContentProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between gap-3 items-end">
                <Input
                    isClearable
                    className="w-full sm:max-w-[44%]"
                    placeholder="Search stickers"
                    startContent={<SearchIcon />}
                    value={filterValue}
                    onClear={() => onClear()}
                    onValueChange={onSearchChange}
                />
                <div className="flex gap-3">
                    <Button onPress={() => { setActionText(); }} color="primary" endContent={<PlusIcon size={20} />}>
                        Add Sticker
                    </Button>
                </div>
            </div>
        </div>
    )
}; 