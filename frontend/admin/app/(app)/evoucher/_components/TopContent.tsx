import { Evoucher } from "@/types/evoucher";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input, Select, SelectItem } from "@heroui/react";
import { ChevronDownIcon, PlusIcon, SearchIcon, Ticket } from "lucide-react";
import { TableColumnType } from "./TableContent";
import React from "react";
import { EvoucherType } from "@/types/evoucher-type";

export interface TopContentProps {
    setIsAddOpen: (value: boolean) => void;
    setActionText: (value: "Add" | "Edit") => void;
    filterValue: string;
    typeFilter: string;
    setTypeFilter: (value: string) => void;
    EvoucherType: EvoucherType[];
    capitalize: (value: string) => string;
    visibleColumns: Set<string> | string[];
    setVisibleColumns: (columns: Set<string>) => void;
    columns: TableColumnType[];
    selectedKeys?: Set<string> | string[];
    filteredItems?: Evoucher[];
    page?: number;
    pages?: number;
    setPage?: (page: number) => void;
    onPreviousPage?: () => void;
    onNextPage?: () => void;
    onClear: () => void;
    onSearchChange: (value: string) => void;
    onRowsPerPageChange: (e: any) => void;
}

export default function TopContent({
    setIsAddOpen,
    setActionText,
    filterValue,
    typeFilter,
    setTypeFilter,
    EvoucherType,
    capitalize,
    visibleColumns,
    setVisibleColumns,
    columns,
    onClear,
    onSearchChange,
    onRowsPerPageChange,
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
                    onClear={() => onClear()}
                    onValueChange={onSearchChange}
                />
                <div className="flex gap-3">
                    <Dropdown>
                        <DropdownTrigger className="hidden sm:flex">
                            <Button endContent={<ChevronDownIcon className="text-small" />} variant="flat">
                                Type
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            disallowEmptySelection
                            aria-label="Table Columns"
                            closeOnSelect={false}
                            selectedKeys={typeFilter}
                            selectionMode="multiple"
                            onSelectionChange={(keys) => {
                                if (typeof keys === "string") {
                                    setTypeFilter(keys);
                                } else if (keys instanceof Set && keys.size > 0) {
                                    setTypeFilter(Array.from(keys)[0] as string);
                                } else {
                                    setTypeFilter("");
                                }
                            }}
                        >
                            {EvoucherType.map((type) => (
                                <DropdownItem key={type.name} className="capitalize">
                                    {capitalize(type.name)}
                                </DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
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
                    <Button onPress={() => {setActionText("Add"); setIsAddOpen(true);}} color="primary" endContent={<PlusIcon size={20} />}>Add Evoucher</Button>
                </div>
            </div>
        </div>
    )
};