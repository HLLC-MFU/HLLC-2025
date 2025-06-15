import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input, Select, SelectItem } from "@heroui/react";
import { ChevronDownIcon, FileInput, FileOutput, Plus, SearchIcon, UserRound } from "lucide-react";
import React, { SetStateAction } from "react";

type ModalState = {
    add: boolean;
    import: boolean;
    export: boolean;
    confirm: boolean;
}

type TopContentProps = {
    setModal: (value: SetStateAction<ModalState>) => void;
    setActionMode: (value: "Add" | "Edit") => void;
    filterValue: string;
    visibleColumns: Set<string>;
    columns: Array<{ uid: string; name: string }>;
    onSearchChange: (value: string) => void;
    onClear: () => void;
    setVisibleColumns: (columns: Set<string>) => void;
    capitalize: (value: string) => string;
}

export default function TopContent({
    setModal,
    setActionMode,
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
                    placeholder="Search user"
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
                            onSelectionChange={(keys) => setVisibleColumns(new Set(Array.from(keys, String)))}
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
                            <Button color="primary" endContent={<Plus size={20} />}>Add new</Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Static Actions">
                            <DropdownItem onPress={() => { setActionMode("Add"); setModal(prev => ({...prev, add: true})); }} key="new" startContent={<UserRound size={16} />}>New user</DropdownItem>
                            <DropdownItem onPress={() => setModal(prev => ({...prev, import: true}))} key="import" startContent={<FileInput size={16} />}>Import .xlsx file</DropdownItem>
                        </DropdownMenu>
                    </Dropdown >
                    <Button color="success" className="text-white" endContent={<FileOutput size={20} />} onPress={() => setModal(prev => ({...prev, export: true}))}>Export</Button>
                </div>
            </div>
        </div >
    );
};