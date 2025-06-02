import { Evoucher } from "@/types/evoucher";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input } from "@heroui/react";
import { ChevronDownIcon, PlusIcon, SearchIcon } from "lucide-react";
import { TableColumnType } from "./TableContent";
import AddModal from "../../users/_components/AddModal";

export interface TopContentProps {
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
}

export default function TopContent({
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
}: TopContentProps) {
    return (
        <div className="flex flex-col gap-4">
            <AddModal
                title="Add Evoucher"
                isOpen={false}
                onClose={() => {}}
                data={[]}
                onAddUser={() => {}}
            />
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
                    <Button color="primary" endContent={<PlusIcon />}>
                        Add Evoucher
                    </Button>
                </div>
            </div>
        </div>
    )
};