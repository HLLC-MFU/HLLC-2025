import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input } from "@heroui/react";
import { ChevronDownIcon, EllipsisVertical, FileInput, FileOutput, Pen, Plus, SearchIcon, Trash, UserRound } from "lucide-react";
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
    onEdit: () => void;
    onDelete: () => void;
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
    onEdit,
    onDelete,
}: TopContentProps) {
    console.log('TopContent received onEdit:', onEdit, 'onDelete:', onDelete); // Debug log
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
                    {/* Only render ellipsis dropdown if onEdit/onDelete are present */}
                    {onEdit && onDelete && (
                        <Dropdown>
                            <DropdownTrigger>
                                <Button isIconOnly size="sm" variant="light">
                                    <EllipsisVertical className="text-default-400" />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu>
                                <DropdownItem
                                    key="edit"
                                    startContent={<Pen size={16} />}
                                    onPress={() => {
                                        console.log('Edit button clicked'); // Debug log
                                        onEdit();
                                    }}
                                >
                                    Edit Role
                                </DropdownItem>
                                <DropdownItem
                                    key="delete"
                                    className="text-danger"
                                    color="danger"
                                    startContent={<Trash size={16} />}
                                    onPress={() => {
                                        console.log('Delete button clicked'); // Debug log
                                        onDelete();
                                    }}
                                >
                                    Delete Role
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    )}
                </div>
            </div>
        </div >
    );
};