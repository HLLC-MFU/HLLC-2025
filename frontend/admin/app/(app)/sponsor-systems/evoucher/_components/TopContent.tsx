import { Button, Input } from "@heroui/react";
import { PlusIcon, SearchIcon } from "lucide-react";
import React from "react";

type TopContentProps = {
    filterValue: string;
    onClear: () => void;
    onSearchChange: (value: string) => void;
    onAdd: () => void;
}

export default function TopContent({
    filterValue,
    onClear,
    onSearchChange,
    onAdd,
}: TopContentProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between gap-3 items-end">
                <Input
                    isClearable
                    className="w-full sm:max-w-[44%]"
                    placeholder="Search evoucher"
                    startContent={<SearchIcon />}
                    value={filterValue}
                    onClear={onClear}
                    onValueChange={onSearchChange}
                />
                <Button
                    className="flex-1 sm:flex-none"
                    color="primary"
                    endContent={<PlusIcon size={20} />}
                    onPress={onAdd}
                >
                    Add Evoucher
                </Button>
            </div>
        </div>
    )
};