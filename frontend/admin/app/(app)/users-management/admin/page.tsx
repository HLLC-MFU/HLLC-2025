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
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export const columns = [
    { name: "STUDENT ID", uid: "username", sortable: true },
    { name: "NAME", uid: "name", sortable: true },
    { name: "SCHOOL", uid: "school", sortable: true },
    { name: "MAJOR", uid: "major", sortable: true },
    { name: "ACTIONS", uid: "actions" },
];

export function capitalize(s: string) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}

const INITIAL_VISIBLE_COLUMNS = ["username", "name", "school", "major", "actions"];

export default function AdminPage() {

    const { users, loading, fetchUsers, createUser, uploadUser, updateUser, deleteUser, deleteMultiple } = useUsers();

    const [filterValue, setFilterValue] = React.useState("");
    const [selectedKeys, setSelectedKeys] = React.useState<"all" | Set<unknown>>(new Set([]));
    const [visibleColumns, setVisibleColumns] = React.useState(new Set(INITIAL_VISIBLE_COLUMNS));
    const [statusFilter, setStatusFilter] = React.useState("all");
    const [rowsPerPage, setRowsPerPage] = React.useState(5);
    const [sortDescriptor, setSortDescriptor] = React.useState({
        column: "username",
        direction: "ascending",
    });

    const [page, setPage] = React.useState(1);
    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
    const [AddModalText, setAddModalText] = React.useState<"Add" | "Edit">("Add");
    const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = React.useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [userIndex, setUserIndex] = React.useState(0);

    const hasSearchFilter = Boolean(filterValue);

    const headerColumns = React.useMemo(() => {
        if (visibleColumns === "all") return columns;

        return columns.filter((column) => Array.from(visibleColumns).includes(column.uid));
    }, [visibleColumns, columns]);

    const filteredItems = React.useMemo(() => {
        let filteredUsers = [...users ?? []];

        if (hasSearchFilter) {
            filteredUsers = filteredUsers.filter((user) =>
                user.username.toLowerCase().includes(filterValue.toLowerCase()),
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
                                    className="text-danger"
                                    color="danger"
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

    const handleAddUser = async (userData: Partial<User>) => {
        if (AddModalText === "Add") {
            await createUser(userData);
        } else if (AddModalText === "Edit") {
            await updateUser(users[userIndex]._id, userData);
        }

        setIsAddModalOpen(false);
        AddToast({
            title: "Add Successful",
            description: "New file has been added successfully",
            color: "success"
        });
        await fetchUsers();
    };

    const handleImportUsers = async (userData: Partial<User>[]) => {
        const res = await uploadUser(userData);

        setIsImportModalOpen(false);
        if (res?.message === "Username already exists") {
            AddToast({
                title: "Username Already Existed",
                description: "Username already existed in database",
                color: "danger"
            })
        } else {
            AddToast({
                title: "Add Successful",
                description: "New file has been added successfully",
                color: "success"
            })
        }
        await fetchUsers();
    };

    const handleExportUsers = (fileName: string) => {
        const transformedData = users.map((item) => ({
            username: item.username,
            first: item.name?.first,
            middle: item.name?.middle ?? "",
            last: item.name?.last,
            role: item.role,
            school_en: item.metadata?.school?.name?.en ?? "",
            school_th: item.metadata?.school?.name?.th ?? "",
            major_en: item.metadata?.major?.name?.en ?? "",
            major_th: item.metadata?.major?.name?.th ?? "",
        }));
        const worksheet = XLSX.utils.json_to_sheet(transformedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: 'array' })
        const blob = new Blob([excelBuffer], { type: "application/octet-stream" })
        saveAs(blob, `${fileName}.xlsx`);
    }

    const handleExportTemplate = () => {
        const template = [{
            "username": [],
            "first": [],
            "middle": [],
            "last": [],
            "role": [],
            "school_en": [],
            "school_th": [],
            "major_en": [],
            "major_th": []
        }];
        const worksheet = XLSX.utils.json_to_sheet(template);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: 'array' })
        const blob = new Blob([excelBuffer], { type: "application/octet-stream" })
        saveAs(blob, "Template.xlsx");
    }

    const handleDeleteUser = async () => {
        if ([...selectedKeys].length > 0) {
            await deleteMultiple([...selectedKeys]);
        } else {
            await deleteUser(users[userIndex]._id);
        }

        setIsDeleteModalOpen(false);
        AddToast({
            title: "Delete Successful",
            description: "Data has been deleted successfully",
            color: "success"
        });
        await fetchUsers();
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
                sortDescriptor={sortDescriptor}
                setSortDescriptor={setSortDescriptor}
                headerColumns={headerColumns}
                sortedItems={sortedItems}
                renderCell={renderCell}
                onRowsPerPageChange={onRowsPerPageChange}
            />

            {users && (
                <>
                    <AddModal
                        title={AddModalText}
                        isOpen={isAddModalOpen}
                        onClose={() => { setIsAddModalOpen(false); setAddModalText("Add"); }}
                        data={users[userIndex]}
                        onAddUser={handleAddUser}
                    />

                    <ImportModal
                        isOpen={isImportModalOpen}
                        onClose={() => setIsImportModalOpen(false)}
                        onImportUsers={handleImportUsers}
                        onExportTemplate={handleExportTemplate}
                    />

                    <ExportModal
                        isOpen={isExportModalOpen}
                        onClose={() => setIsExportModalOpen(false)}
                        data={users}
                        onExportUsers={handleExportUsers}
                    />

                    <DeleteModal
                        isOpen={isDeleteModalOpen}
                        onClose={() => setIsDeleteModalOpen(false)}
                        data={users}
                        userIndex={userIndex}
                        selectedKeys={selectedKeys}
                        onDeleteUser={handleDeleteUser}
                    />
                </>
            )}
        </>
    );
}

