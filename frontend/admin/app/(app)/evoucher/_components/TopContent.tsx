import { Evoucher } from "@/types/evoucher/d";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input, Select, SelectItem } from "@heroui/react";
import { ChevronDownIcon, PlusIcon, SearchIcon, Ticket } from "lucide-react";
import { TableColumnType } from "./TableContent";
import React from "react";
import type { Selection } from "@react-types/shared";

export interface TopContentProps {
    setActionText: (value: "Add" | "Edit") => void;
    filterValue: string;
    typeFilter: Selection;
    setTypeFilter: (value: Selection) => void;
    capitalize: (value: string) => string;
    visibleColumns: Set<string> | string[];
    setVisibleColumns: (columns: Set<string>) => void;
    columns: TableColumnType[];
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
    typeFilter,
    setTypeFilter,
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
                            onSelectionChange={setTypeFilter}
                        >
                            <DropdownItem key="GLOBAL" className="capitalize">
                                {capitalize("GLOBAL")}
                            </DropdownItem>
                            <DropdownItem key="INDIVIDUAL" className="capitalize">
                                {capitalize("INDIVIDUAL")}
                            </DropdownItem>
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
                    <Button onPress={() => { setActionText("Add"); }} color="primary" endContent={<PlusIcon size={20} />}>Add Evoucher</Button>
                </div>
            </div>
        </div>
    )
};