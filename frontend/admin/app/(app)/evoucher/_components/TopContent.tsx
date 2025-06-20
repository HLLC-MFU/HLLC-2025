import { Evoucher } from "@/types/evoucher";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input } from "@heroui/react";
import { ChevronDownIcon, PlusIcon, SearchIcon } from "lucide-react";
import React from "react";
import type { Selection } from "@react-types/shared";
import { useSponsors } from "@/hooks/useSponsors";

interface TopContentProps {
    setActionText: (value: "Add" | "Edit") => void;
    filterValue: string;
    capitalize: (value: string) => string;
    visibleColumns: Set<string> | string[];
    setVisibleColumns: (columns: Set<string>) => void;
    selectedKeys: Selection;
    filteredItems: Evoucher[];
    page: number;
    pages: number;
    setPage: (page: number) => void;
    onPreviousPage: () => void;
    onNextPage: () => void;
    onClear: () => void;
    onSearchChange: (value: string) => void;
}

export default function TopContent({
    setActionText,
    filterValue,
    capitalize,
    visibleColumns,
    setVisibleColumns,
    onClear,
    onSearchChange,
}: TopContentProps) {
    const { sponsors } = useSponsors();
    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between gap-3 items-end">
                <Input
                    isClearable
                    className="w-full sm:max-w-[44%]"
                    placeholder="Search evoucher"
                    startContent={<SearchIcon />}
                    value={filterValue}
                    onClear={() => onClear()}
                    onValueChange={onSearchChange}
                />
                <div className="flex gap-3">
                    <Dropdown>
                        <DropdownTrigger className="hidden sm:flex">
                            <Button endContent={<ChevronDownIcon className="text-small" />} variant="flat">
                                Sponsor
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            disallowEmptySelection
                            aria-label="Table Columns"
                            closeOnSelect={false}
                            selectionMode="multiple"
                        >
                            {sponsors.map((sponsor) => (
                                <DropdownItem key={sponsor._id} className="capitalize">
                                    {capitalize(sponsor.name.en)}
                                </DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                    <Button onPress={() => { setActionText("Add"); }} color="primary" endContent={<PlusIcon size={20} />}>Add Evoucher</Button>
                </div>
            </div>
        </div>
    )
};