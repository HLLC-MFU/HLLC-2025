import { Button, Input } from "@heroui/react";
import { Plus, SearchIcon } from "lucide-react";
import React from "react";
interface TopContentProps {
    filterValue: string;
    onClear: () => void;
    onSearchChange: (value: string) => void;
    setUsedModal: (value: boolean) => void;
}

export default function TopContent({
    filterValue,
    onSearchChange,
    onClear,
    setUsedModal,
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
                <Button
                    color='primary'
                    onPress={() => setUsedModal(true)}
                    endContent={<Plus />}
                >
                    Add Evoucher Code
                </Button>
            </div>
        </div>
    )
};
