"use client";

import React from "react";
import {
  Button,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { EllipsisVertical, Pen, Trash } from "lucide-react";
import { User } from "@/types/user";
import TableContent from "./TableContent";
import AddModal from "./AddModal";
import ExportModal from "./ExportModal";
import ImportModal from "./ImportModal";
import { ConfirmationModal } from "@/components/modal/ConfirmationModal";
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"
import { useUsers } from "@/hooks/useUsers";

export const columns = [
  { name: "STUDENT ID", uid: "username", sortable: true },
  { name: "NAME", uid: "name" },
  { name: "SCHOOL", uid: "school" },
  { name: "MAJOR", uid: "major" },
  { name: "ACTIONS", uid: "actions" },
];

export function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}

const INITIAL_VISIBLE_COLUMNS = [
  "username",
  "name",
  "school",
  "major",
  "actions",
];

export default function UsersTable({
  roleName,
  roleId,
  users,
}: {
  roleName: string;
  roleId: string;
  users: User[];
}) {
  const { createUser, updateUser, uploadUser, deleteUser, deleteMultiple } = useUsers();

  const [isAddOpen, setIsAddOpen] = React.useState<boolean>(false);
  const [isImportOpen, setIsImportOpen] = React.useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = React.useState<boolean>(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState<boolean>(false);
  const [actionText, setActionText] = React.useState<"Add" | "Edit">("Add");
  const [userIndex, setUserIndex] = React.useState<number>(0);

  const [filterValue, setFilterValue] = React.useState("");
  const [selectedKeys, setSelectedKeys] = React.useState<"all" | Set<string | number>>(
    new Set([])
  );
  const [visibleColumns, setVisibleColumns] = React.useState(
    new Set(INITIAL_VISIBLE_COLUMNS)
  );
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [sortDescriptor, setSortDescriptor] = React.useState({
    column: "username",
    direction: "ascending" as "ascending" | "descending",
  });
  const [page, setPage] = React.useState(1);

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = React.useMemo(() => {
    return columns.filter((column) =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns]);

  const filteredItems = React.useMemo(() => {
    let filteredUsers = [...users ?? []];
    if (hasSearchFilter) {
      filteredUsers = filteredUsers.filter((user) =>
        user.username.toLowerCase().includes(filterValue.toLowerCase()) ||
        `${user.name.first} ${user.name.middle ?? ""} ${user.name.last}`.toLowerCase().includes(filterValue.toLowerCase()) 
      );
    }
    return filteredUsers;
  }, [users, filterValue]);

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

      if (first === undefined && second === undefined) return 0;
      if (first === undefined) return sortDescriptor.direction === "descending" ? 1 : -1;
      if (second === undefined) return sortDescriptor.direction === "descending" ? -1 : 1;

      const cmp = first < second ? -1 : first > second ? 1 : 0;
      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const renderCell = React.useCallback(
    (item: User, columnKey: React.Key, index: number) => {
      const rowIndex = (page * rowsPerPage) - rowsPerPage + index;
      const cellValue = item[columnKey as keyof typeof item];
      switch (columnKey) {
        case "name":
          return `${item.name.first} ${item.name.middle ?? ""} ${item.name.last}`;
        case "school":
          return item.metadata?.school?.name?.en ?? "-";
        case "major":
          return item.metadata?.major?.name?.en ?? "-";
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
                    onPress={() => { setActionText("Edit"); setIsAddOpen(true); setUserIndex(rowIndex); }}
                  >
                    Edit
                  </DropdownItem>
                  <DropdownItem
                    key="delete"
                    startContent={<Trash size="16px" />}
                    className="text-danger"
                    color="danger"
                    onPress={() => { setIsDeleteOpen(true); setUserIndex(rowIndex); }}
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
    },
    [page, selectedKeys]
  );

  const handleAdd = (user: Partial<User>) => {
    if (actionText === "Add") createUser(user);
    if (actionText === "Edit") updateUser(users[userIndex]._id, user);
    setIsAddOpen(false);
  };

  const handleImport = (user: Partial<User>[]) => {
    uploadUser(user)
    setIsImportOpen(false);
  };

  const handleExport = (fileName?: string) => {
    let temp = [];
    if (fileName) {
      temp = users.map((user) => ({
        username: user.username,
        first: user.name?.first,
        middle: user.name?.middle ?? "",
        last: user.name?.last,
        role: user.role?.name,
        // school_en: user.metadata?.school?.name?.en ?? "",
        // school_th: user.metadata?.school?.name?.th ?? "",
        // major_en: user.metadata?.major?.name?.en ?? "",
        // major_th: user.metadata?.major?.name?.th ?? "",
      }))
    } else {
      temp = [{
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
    }
    const worksheet = XLSX.utils.json_to_sheet(temp);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: 'array' })
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" })
    if (fileName) {
      saveAs(blob, `${fileName}.xlsx`)
    } else {
      saveAs(blob, "Template.xlsx")
    }
    setIsExportOpen(false);
  };

  console.log(Array.from(selectedKeys))

  const handleDelete = () => {
    if (Array.from(selectedKeys).length > 0) {
      deleteMultiple(Array.from(selectedKeys) as string[]);
    } else {
      deleteUser(users[userIndex]._id)
    }
    setIsDeleteOpen(false);
  };

  return (
    <div>
      <TableContent
        setIsAddOpen={setIsAddOpen}
        setIsImportOpen={setIsImportOpen}
        setIsExportOpen={setIsExportOpen}
        setActionText={setActionText}
        filterValue={filterValue}
        visibleColumns={visibleColumns}
        columns={columns}
        onSearchChange={(val) => {
          setFilterValue(val);
          setPage(1);
        }}
        onClear={() => {
          setFilterValue("");
          setPage(1);
        }}
        setVisibleColumns={setVisibleColumns}
        capitalize={capitalize}
        selectedKeys={selectedKeys}
        filteredItems={filteredItems}
        pages={pages}
        page={page}
        setPage={setPage}
        onPreviousPage={() => setPage((p) => Math.max(1, p - 1))}
        onNextPage={() => setPage((p) => p + 1)}
        setSelectedKeys={setSelectedKeys}
        sortDescriptor={sortDescriptor}
        setSortDescriptor={setSortDescriptor}
        headerColumns={headerColumns}
        sortedItems={sortedItems}
        renderCell={renderCell}
      />

      {/* Add and Edit  */}
      <AddModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={handleAdd}
        roleId={roleId}
        action={actionText}
        user={users[userIndex]}
      />

      {/* Import */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImport}
        onExportTemplate={() => handleExport()}
      />

      {/* Export */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onExport={handleExport}
      />

      {/* Delete */}
      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title={"Delete user"}
        body={"Are you sure you want to delete this user?"}
        confirmColor={'danger'}
      />
    </div>
  );
}
