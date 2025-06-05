import { Evoucher } from "@/types/evoucher";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input, Select, SelectItem } from "@heroui/react";
import { ChevronDownIcon, PlusIcon, SearchIcon, Ticket } from "lucide-react";
import { TableColumnType } from "./TableContent";
import React from "react";

export interface TopContentProps {
    setIsAddOpen: (value: boolean) => void;
    setActionText: (value: string) => void;
    filterValue: string;
    typeFilter: string;
    setTypeFilter: (value: string) => void;
    typeOptions: string[];
    capitalize: (value: string) => string;
    visibleColumns: Set<string> | string[];
    setVisibleColumns: (columns: string[]) => void;
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
    typeOptions,
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
                            onSelectionChange={setTypeFilter}
                        >
                            {typeOptions.map((type) => (
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
                            onSelectionChange={setVisibleColumns}
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
            <label className="flex items-center text-default-400 text-small">
                <Select className="max-w-xs" label="Rows per page:" defaultSelectedKeys={"5"} variant="underlined" onChange={onRowsPerPageChange}>
                    <SelectItem key="5">5</SelectItem>
                    <SelectItem key="10">10</SelectItem>
                    <SelectItem key="15">15</SelectItem>
                </Select>
            </label>
        </div>
    )
};