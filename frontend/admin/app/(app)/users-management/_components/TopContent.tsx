import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input } from "@heroui/react";
import { ChevronDownIcon, FileInput, FileOutput, PlusIcon, SearchIcon, UserRound } from "lucide-react";
import React from "react";

interface TopContentProps {
    filterValue: string;
    visibleColumns: Set<string>;
    columns: any[];
    onSearchChange: (value: string) => void;
    onClear: () => void;
    setVisibleColumns: (columns: Set<string>) => void;
    capitalize: (value: string) => string;
    setAddModalText: React.Dispatch<React.SetStateAction<"Add" | "Edit">>;
    setIsAddModalOpen: (value: boolean) => void;
    setIsImportModalOpen: (value: boolean) => void;
    setIsExportModalOpen: (value: boolean) => void;
}

export default function TopContent({
    filterValue,
    visibleColumns,
    columns,
    onSearchChange,
    onClear,
    setVisibleColumns,
    capitalize,
    setAddModalText,
    setIsAddModalOpen,
    setIsImportModalOpen,
    setIsExportModalOpen
}: TopContentProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between gap-3 items-end">
                <Input
                    isClearable
                    className="w-full sm:max-w-[44%]"
                    placeholder="Search by name..."
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
                            onSelectionChange={setVisibleColumns}
                        >
                            {columns.map((column) => (
                                <DropdownItem key={column.uid} className="capitalize">
                                    {capitalize(column.name)}
                                </DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                    {/* Add these to other file  */}
                    <Dropdown>
                        <DropdownTrigger>
                            <Button color="primary" endContent={<PlusIcon size={20} />}>Add new</Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Static Actions">
                            <DropdownItem onPress={() => { setAddModalText("Add"); setIsAddModalOpen(true); }} key="new" startContent={<UserRound size={16} />}>New user</DropdownItem>
                            <DropdownItem onPress={() => setIsImportModalOpen(true)} key="import" startContent={<FileInput size={16} />}>Import .xlsx file</DropdownItem>
                        </DropdownMenu>
                    </Dropdown >
                    <Button color="success" className="text-white" endContent={<FileOutput size={20} />} onPress={() => setIsExportModalOpen(true)}>Export</Button>
                </div>
            </div>
        </div>
    );
};