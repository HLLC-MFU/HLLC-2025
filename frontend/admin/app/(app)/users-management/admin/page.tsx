"use client"
import React from "react";
import { Button, DropdownTrigger, Dropdown, DropdownMenu, DropdownItem, } from "@heroui/react";
import { EllipsisVertical, Pen, Trash, } from "lucide-react";
import AddModal from "../_components/AddModal";
import ImportModal from "../_components/ImportModal";
import ExportModal from "../_components/ExportModal";
import DeleteModal from "../_components/DeleteModal";
import { User } from "@/types/user";
import { useUsers } from "@/hooks/useUsers";
import TableContent from "../_components/TableContent";
import AddToast from "../_components/AddToast";

export const columns = [
    { name: "STUDENT ID", uid: "username", sortable: true },
    { name: "NAME", uid: "name", sortable: true },
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

    const { users, loading, createUser, uploadUser, updateUser, deleteUser, deleteMultiple } = useUsers();

    const [filterValue, setFilterValue] = React.useState("");
    const [selectedKeys, setSelectedKeys] = React.useState(new Set([]));
    const [visibleColumns, setVisibleColumns] = React.useState(new Set(INITIAL_VISIBLE_COLUMNS));
    const [statusFilter, setStatusFilter] = React.useState("all");
    const [rowsPerPage, setRowsPerPage] = React.useState(6);
    const [sortDescriptor, setSortDescriptor] = React.useState({
        column: "id",
        direction: "ascending",
    });
    const [page, setPage] = React.useState(1);
    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
    const [AddModalText, setAddModalText] = React.useState<"Add" | "Edit">("Add");
    const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = React.useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [startIndex, setUserIndex] = React.useState(0);

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
            const first = a[sortDescriptor.column as keyof User];
            const second = b[sortDescriptor.column as keyof User];

            if (first === null && second === null) return 0;
            if (first === null) return sortDescriptor.direction === "descending" ? 1 : -1;
            if (second === null) return sortDescriptor.direction === "descending" ? -1 : 1;

            const cmp = first < second ? -1 : first > second ? 1 : 0;

            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [sortDescriptor, items]);

    const renderCell = React.useCallback((item: User, columnKey: React.Key, index: number) => {
        const cellValue = item[columnKey as keyof typeof item];

        switch (columnKey) {
            case "name":
                return `${item.name.first} ${item.name.middle ?? ''} ${item.name.last}`;
            case "school":
                return item.metadata?.school?.name?.en ?? null;
            case "major":
                return item.metadata?.major?.name?.en ?? null;
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
                                <DropdownItem
                                    key="edit"
                                    startContent={<Pen size="16px" />}
                                    onPress={() => { setAddModalText("Edit"); setIsAddModalOpen(true); setUserIndex((page * rowsPerPage) + index - rowsPerPage); }}
                                >
                                    Edit
                                </DropdownItem>
                                <DropdownItem
                                    key="delete"
                                    startContent={<Trash size="16px" />}
                                    onPress={() => { setIsDeleteModalOpen(true); setUserIndex((page * rowsPerPage) + index - rowsPerPage); }}
                                >
                                    Delete
                                </DropdownItem>
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

    const onRowsPerPageChange = React.useCallback((e: any) => {
        setRowsPerPage(Number(e.target.value));
        setPage(1);
    }, []);

    const onSearchChange = React.useCallback((value: string) => {
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

    const handleAddUser = (userData: Partial<User>) => {
        if (AddModalText === "Add") {
            createUser(userData);
        } else if (AddModalText === "Edit") {
            updateUser(users[startIndex]._id, userData);
        }

        setIsAddModalOpen(false);
        AddToast({
            title: "Add Successful",
            description: "New file has been added successfully"
        });
    };

    const handleImportUsers = (userData: Partial<User>[]) => {
        uploadUser(userData);

        setIsImportModalOpen(false);
        AddToast({
            title: "Add Successful",
            description: "New file has been added successfully"
        })
    };

    // const handleExportUsers = (userData: Partial<User>) => {

    // }

    // const handleExportTemplate = (data: []) => {

    // }

    const handleDeleteUser = () => {
        if ([...selectedKeys].length > 0) {
            deleteMultiple([...selectedKeys]);
        } else {
            deleteUser(users[startIndex]._id);
        }

        setIsDeleteModalOpen(false);
        AddToast({
            title: "Delete Successful",
            description: "Data has been deleted successfully",
        });
    };

    return (
        <>
            <TableContent
                filterValue={filterValue}
                visibleColumns={visibleColumns}
                columns={columns}
                onSearchChange={onSearchChange}
                onClear={onClear}
                setVisibleColumns={setVisibleColumns}
                capitalize={capitalize}
                setAddModalText={setAddModalText}
                setIsAddModalOpen={setIsAddModalOpen}
                setIsImportModalOpen={setIsImportModalOpen}
                setIsExportModalOpen={setIsExportModalOpen}
                selectedKeys={selectedKeys}
                filteredItems={filteredItems}
                pages={pages}
                page={page}
                setPage={setPage}
                onPreviousPage={onPreviousPage}
                onNextPage={onNextPage}
                setSelectedKeys={setSelectedKeys}
                setSortDescriptor={setSortDescriptor}
                headerColumns={headerColumns}
                sortedItems={sortedItems}
                renderCell={renderCell}
            />

            {users && (
                <>
                    <AddModal
                        title={AddModalText}
                        isOpen={isAddModalOpen}
                        onClose={() => { setIsAddModalOpen(false); setAddModalText("Add"); }}
                        data={users[startIndex]}
                        onAddUser={handleAddUser}
                    />

                    <ImportModal
                        isOpen={isImportModalOpen}
                        onClose={() => setIsImportModalOpen(false)}
                        onImportUsers={handleImportUsers}
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
                        selectedKeys={selectedKeys}
                        onDeleteUser={handleDeleteUser}
                    />
                </>
            )}
        </>
    );
}

