import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input, Select, SelectItem } from "@heroui/react";
import { ChevronDownIcon, FileInput, FileOutput, PlusIcon, SearchIcon, UserRound } from "lucide-react";
import React from "react";

interface TopContentProps {
    setIsAddOpen: (value: boolean) => void;
    setIsImportOpen: (value: boolean) => void;
    setIsExportOpen: (value: boolean) => void;
    setActionText: (value: string) => void;
    filterValue: string;
    visibleColumns: Set<string>;
    columns: any[];
    onSearchChange: (value: string) => void;
    onClear: () => void;
    setVisibleColumns: (columns: Set<string>) => void;
    capitalize: (value: string) => string;
    onRowsPerPageChange: (e: any) => void;
}

export default function TopContent({
    setIsAddOpen,
    setIsImportOpen,
    setIsExportOpen,
    setActionText,
    filterValue,
    visibleColumns,
    columns,
    onSearchChange,
    onClear,
    setVisibleColumns,
    capitalize,
}: TopContentProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between gap-3 items-end">
                <Input
                    isClearable
                    className="w-full sm:max-w-[44%]"
                    placeholder="Search by student id..."
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
                            onSelectionChange={(keys) => setVisibleColumns(new Set(Array.from(keys as any)))}
                        >
                            {columns.map((column) => (
                                <DropdownItem key={column.uid} className="capitalize">
                                    {capitalize(column.name)}
                                </DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                    <Dropdown>
                        <DropdownTrigger>
                            <Button color="primary" endContent={<PlusIcon size={20} />}>Add new</Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Static Actions">
                            <DropdownItem onPress={() => { setActionText("Add"); setIsAddOpen(true); }} key="new" startContent={<UserRound size={16} />}>New user</DropdownItem>
                            <DropdownItem onPress={() => setIsImportOpen(true)} key="import" startContent={<FileInput size={16} />}>Import .xlsx file</DropdownItem>
                        </DropdownMenu>
                    </Dropdown >
                    <Button color="success" className="text-white" endContent={<FileOutput size={20} />} onPress={() => setIsExportOpen(true)}>Export</Button>
                </div>
            </div>
            {/* <label className="flex items-center text-default-400 text-small">
                <Select className="max-w-xs" label="Rows per page:" defaultSelectedKeys={"5"} variant="underlined" onChange={onRowsPerPageChange}>
                    <SelectItem key="5">5</SelectItem>
                    <SelectItem key="10">10</SelectItem>
                    <SelectItem key="15">15</SelectItem>
                </Select>
            </label> */}
        </div >
    );
};