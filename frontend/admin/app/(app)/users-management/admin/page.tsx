"use client"
import React from "react";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Input,
    Button,
    DropdownTrigger,
    Dropdown,
    DropdownMenu,
    DropdownItem,
    Pagination,
} from "@heroui/react";
import { ChevronDownIcon, EllipsisVertical, FileInput, FileOutput, Pen, PlusIcon, SearchIcon, Trash, UserRound, } from "lucide-react";
import AddModal from "../_components/AddModal";
import ImportModal from "../_components/ImportModal";
import ExportModal from "../_components/ExportModal";
import DeleteModal from "../_components/DeleteModal";
import { UserType, useUser, } from "@/app/context/UserContext";

export const columns = [
    { name: "USERNAME", uid: "username", sortable: true },
    { name: "NAME", uid: "name", sortable: true },
    { name: "ROLE", uid: "role", sortable: true },
    { name: "SCHOOL", uid: "school", sortable: true },
    { name: "MAJOR", uid: "major", sortable: true },
    { name: "ACTIONS", uid: "actions" },
];

export const statusOptions = [
    { name: "Active", uid: "active" },
    { name: "Paused", uid: "paused" },
    { name: "Vacation", uid: "vacation" },
];

export function capitalize(s: string) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}

const INITIAL_VISIBLE_COLUMNS = ["username", "name", "school", "major", "actions"];

export default function AdminPage() {

    const users = useUser();

    const [filterValue, setFilterValue] = React.useState("");
    const [selectedKeys, setSelectedKeys] = React.useState(new Set([]));
    const [visibleColumns, setVisibleColumns] = React.useState(new Set(INITIAL_VISIBLE_COLUMNS));
    const [statusFilter, setStatusFilter] = React.useState("all");
    const [rowsPerPage, setRowsPerPage] = React.useState(5);
    const [sortDescriptor, setSortDescriptor] = React.useState({
        column: "id",
        direction: "ascending",
    });
    const [page, setPage] = React.useState(1);
    // Add this to other file
    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
    const [AddModalText, setAddModalText] = React.useState<"Add" | "Edit">("Add");
    const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = React.useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [startIndex, setStartIndex] = React.useState(0);
    const [endIndex, setEndIndex] = React.useState(1);

    const hasSearchFilter = Boolean(filterValue);

    const headerColumns = React.useMemo(() => {
        if (visibleColumns === "all") return columns;

        return columns.filter((column) => Array.from(visibleColumns).includes(column.uid));
    }, [visibleColumns, columns]);

    const filteredItems = React.useMemo(() => {
        let filteredUsers = [...users ?? []];

        if (hasSearchFilter) {
            filteredUsers = filteredUsers.filter((user) =>
                user._id.toLowerCase().includes(filterValue.toLowerCase()),
            );
        }
        return filteredUsers;
    }, [users, filterValue, statusFilter]);

    const pages = Math.ceil(filteredItems.length / rowsPerPage);


    const items = React.useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        return filteredItems.slice(start, end);
    }, [page, filteredItems, rowsPerPage]);

    const sortedItems = React.useMemo(() => {
        return [...items].sort((a, b) => {
            const first = a[sortDescriptor.column as keyof UserType];
            const second = b[sortDescriptor.column as keyof UserType];

            if (first === null && second === null) return 0;
            if (first === null) return sortDescriptor.direction === "descending" ? 1 : -1;
            if (second === null) return sortDescriptor.direction === "descending" ? -1 : 1;

            const cmp = first < second ? -1 : first > second ? 1 : 0;

            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [sortDescriptor, items]);

    const renderCell = React.useCallback((item: UserType, columnKey: React.Key, index: number) => {
        const cellValue = item[columnKey as keyof typeof item];

        switch (columnKey) {
            case "name":
                return `${item.name.first} ${item.name.middle === null ? "" : item.name.middle} ${item.name.last}`;
            case "metadata":
                return (
                    <div className="flex flex-col">
                        <p className="text-bold text-small capitalize">{item.metadata.email}</p>
                        <p className="text-bold text-small capitalize">{item.metadata.school.name.en}</p>
                    </div>
                );
            case "school":
                return item.metadata.school.name.en;
            case "major":
                return item.metadata.major?.name.en ?? null;
            case "actions":
                return (
                    <div className="relative flex justify-end items-center gap-2">
                        <Dropdown>
                            <DropdownTrigger>
                                <Button isIconOnly size="sm" variant="light">
                                    <EllipsisVertical className="text-default-300" />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu>
                                <DropdownItem key="edit" startContent={<Pen size="16px" />} onPress={() => { setAddModalText("Edit"); setIsAddModalOpen(true); setStartIndex((page * 5) + index - 5); }}>Edit</DropdownItem>
                                <DropdownItem key="delete" startContent={<Trash size="16px" />} onPress={() => { setIsDeleteModalOpen(true); setStartIndex((page * 5) + index - 5); setEndIndex((page * 5) + index - 4); }}>Delete</DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                );
            default:
                if (typeof cellValue === "object" && cellValue !== null) {
                    return JSON.stringify(cellValue);
                }
                return cellValue as React.ReactNode;
        }
    }, [page]);

    const onNextPage = React.useCallback(() => {
        if (page < pages) {
            setPage(page + 1);
        }
    }, [page, pages]);

    const onPreviousPage = React.useCallback(() => {
        if (page > 1) {
            setPage(page - 1);
        }
    }, [page]);

    const onRowsPerPageChange = React.useCallback((e) => {
        setRowsPerPage(Number(e.target.value));
        setPage(1);
    }, []);

    const onSearchChange = React.useCallback((value) => {
        if (value) {
            setFilterValue(value);
            setPage(1);
        } else {
            setFilterValue("");
        }
    }, []);

    const onClear = React.useCallback(() => {
        setFilterValue("");
        setPage(1);
    }, []);

    const topContent = React.useMemo(() => {
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
                                    Status
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                                disallowEmptySelection
                                aria-label="Table Columns"
                                closeOnSelect={false}
                                selectedKeys={statusFilter}
                                selectionMode="multiple"
                                onSelectionChange={setStatusFilter}
                            >
                                {statusOptions.map((status) => (
                                    <DropdownItem key={status.uid} className="capitalize">
                                        {capitalize(status.name)}
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
    }, [
        filterValue,
        statusFilter,
        visibleColumns,
        onRowsPerPageChange,
        users,
        onSearchChange,
        hasSearchFilter,
        isAddModalOpen,
        isImportModalOpen,
        isExportModalOpen,
    ]);

    const bottomContent = React.useMemo(() => {
        return (
            <div className="py-2 px-2 flex justify-between items-center">
                <span className="w-[30%] text-small text-default-400">
                    {selectedKeys === "all"
                        ? "All items selected"
                        : `${selectedKeys.size} of ${filteredItems.length} selected`}
                </span>
                <Pagination
                    isCompact
                    showControls
                    showShadow
                    color="primary"
                    page={page}
                    total={pages}
                    onChange={setPage}
                />
                <div className="hidden sm:flex w-[30%] justify-end gap-2">
                    <Button isDisabled={pages === 1} size="sm" variant="flat" onPress={onPreviousPage}>
                        Previous
                    </Button>
                    <Button isDisabled={pages === 1} size="sm" variant="flat" onPress={onNextPage}>
                        Next
                    </Button>
                </div>
            </div>
        );
    }, [selectedKeys, items.length, page, pages, hasSearchFilter]);

    return (
        <>
            <Table
                isHeaderSticky
                aria-label="Example table with custom cells, pagination and sorting"
                bottomContent={bottomContent}
                bottomContentPlacement="outside"
                classNames={{
                    wrapper: "max-h-[382px]",
                }}
                selectedKeys={selectedKeys}
                selectionMode="multiple"
                // sortDescriptor={sortDescriptor}
                topContent={topContent}
                topContentPlacement="outside"
            // onSelectionChange={setSelectedKeys}
            // onSortChange={setSortDescriptor}
            >
                <TableHeader columns={headerColumns}>
                    {(column) => (
                        <TableColumn
                            key={column.uid}
                            align={column.uid === "actions" ? "center" : "start"}
                        // allowsSorting={column.sortable}
                        >
                            {column.name}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody emptyContent={"No users found"} items={sortedItems}>
                    {(item: UserType) => {
                        const index = sortedItems.findIndex((i) => i._id === item._id)
                        return (
                            <TableRow key={item._id}>
                                {(columnKey) => <TableCell>{renderCell(item, columnKey, index)}</TableCell>}
                            </TableRow>
                        )
                    }}
                </TableBody>
            </Table>

            {users && (
                <>
                    <AddModal
                        title={AddModalText}
                        isOpen={isAddModalOpen}
                        onClose={() => { setIsAddModalOpen(false); setAddModalText("Add"); }}
                        data={users[startIndex]}
                    />

                    <ImportModal
                        isOpen={isImportModalOpen}
                        onClose={() => setIsImportModalOpen(false)}
                    />

                    <ExportModal
                        isOpen={isExportModalOpen}
                        onClose={() => setIsExportModalOpen(false)}
                        data={users}
                    />

                    <DeleteModal
                        isOpen={isDeleteModalOpen}
                        onClose={() => setIsDeleteModalOpen(false)}
                        data={users}
                        startIndex={startIndex}
                        endIndex={endIndex}
                    />
                </>
            )}
        </>
    );
}

