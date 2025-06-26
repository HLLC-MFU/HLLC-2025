import { EvoucherCode } from "@/types/evoucher-code";
import { Button, Input } from "@heroui/react";
import { PlusIcon, SearchIcon } from "lucide-react";
import React from "react";
interface TopContentProps {
    setActionText: (value: "Add" | "Edit") => void;
    filterValue: string;
    onClear: () => void;
    onSearchChange: (value: string) => void;
}

export default function TopContent({
    filterValue,
    onSearchChange,
    setActionText,
    onClear,
}: TopContentProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between gap-3 items-end">
                <Input
                    isClearable
                    className="w-full sm:max-w-[44%]"
                    placeholder="Search evoucher code"
                    startContent={<SearchIcon />}
                    value={filterValue}
                    onValueChange={onSearchChange}
                    onClear={() => onClear()}
                />
                <div className="flex gap-3">
                    <Button onPress={() => { setActionText("Add"); }} color="primary" endContent={<PlusIcon size={20} />}>Add Evoucher Code</Button>
                </div>
            </div>
        </div>
    )
};
