import { EvoucherCode } from "@/types/evoucher-code";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input } from "@heroui/react";
import { ChevronDownIcon, PlusIcon, SearchIcon } from "lucide-react";
import React from "react";
import { TableColumnType } from "../../evoucher/_components/EvoucherTable";

interface TopContentProps {
    setActionText: (value: "Add" | "Edit") => void;
    filterValue: string;
    capitalize: (value: string) => string;
    visibleColumns: Set<string> | string[];
    setVisibleColumns: (columns: Set<string>) => void;
    columns: TableColumnType[];
    filteredItems: EvoucherCode[];
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
    columns,
    onClear,
    onSearchChange,
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
                    onClear={() => onClear()}
                    onValueChange={onSearchChange}
                />
                <div className="flex gap-3">
                    <Dropdown>
                        <DropdownTrigger className="hidden sm:flex">
                            <Button endContent={<ChevronDownIcon className="text-small" />} variant="flat">
                                Columns
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            disallowEmptySelection
                            aria-label="Table Columns"
                            closeOnSelect={false}
                            selectedKeys={visibleColumns}
                            selectionMode="multiple"
                            onSelectionChange={(keys) => {
                                if (typeof keys === "string") {
                                    setVisibleColumns(new Set([keys]));
                                } else if (keys instanceof Set) {
                                    setVisibleColumns(keys as Set<string>);
                                } else {
                                    setVisibleColumns(new Set());
                                }
                            }}
                        >
                            {columns.map((column) => (
                                <DropdownItem key={column.uid} className="capitalize">
                                    {capitalize(column.name)}
                                </DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                    <Button onPress={() => { setActionText("Add"); }} color="primary" endContent={<PlusIcon size={20} />}>Add Evoucher Code</Button>
                </div>
            </div>
        </div>
    )
};
