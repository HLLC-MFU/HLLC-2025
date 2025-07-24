import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input } from "@heroui/react";
import { EllipsisVertical, Pen, PlusIcon, SearchIcon, Trash } from "lucide-react";
import React from "react";

type TopContentProps = {
    filterValue: string;
    onClear: () => void;
    onSearchChange: (value: string) => void;
    onAdd: () => void;
    onEdit: () => void
    onDelete: () => void
}

export default function TopContent({
    filterValue,
    onClear,
    onSearchChange,
    onAdd,
    onEdit,
    onDelete,
}: TopContentProps) {
    return (
        <div className="flex flex-col gap-4 flex-1 justify-bewtween">
            <div className="flex w-full items-center justify-between">

                <Input
                    isClearable
                    className="w-full sm:max-w-[44%]"
                    placeholder="Search activity"
                    startContent={<SearchIcon />}
                    value={filterValue}
                    onClear={onClear}
                    onValueChange={onSearchChange}
                />

                <div className="flex items-center gap-5">
                    <Button
                        className="flex-1 sm:flex-none"
                        color="primary"
                        endContent={<PlusIcon size={20} />}
                        onPress={onAdd}
                    >
                        Add Activity
                    </Button>

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
                                onPress={onEdit}
                            >
                                Edit
                            </DropdownItem>
                            <DropdownItem
                                key="delete"
                                className="text-danger"
                                color="danger"
                                startContent={<Trash size={16} />}
                                onPress={onDelete}
                            >
                                Delete
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </div>
            </div>
        </div>
    )
};