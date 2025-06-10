"use client";

import React, { useState, useCallback, useMemo, Key, ReactNode, } from "react";
import {
  Button,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  addToast,
  SortDescriptor,
} from "@heroui/react";
import { EllipsisVertical, Pen, RotateCcw, Trash } from "lucide-react";
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"

import TableContent from "./TableContent";
import AddModal from "./AddUserModal";
import ExportModal from "./ExportModal";
import ImportModal from "./ImportModal";

import { User } from "@/types/user";
import { ConfirmationModal } from "@/components/modal/ConfirmationModal";
import { useUsers } from "@/hooks/useUsers";
import { Major, School } from "@/types/school";

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
  majors,
  users,
  schools
}: {
  roleName: string;
  roleId: string;
  majors: Major[];
  users: User[];
  schools: School[];
}) {
  const { fetchUsers, createUser, updateUser, uploadUser, deleteUser, deleteMultiple } = useUsers();

  const [modal, setModal] = useState({
    add: false,
    import: false,
    export: false,
    confirm: false,
  });
  const [actionText, setActionText] = useState<"Add" | "Edit">("Add");
  const [confirmText, setConfirmText] = useState<"Delete" | "Reset">("Delete")
  const [userIndex, setUserIndex] = useState<number>(0);

  const [filterValue, setFilterValue] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<"all" | Set<string | number>>(
    new Set([])
  );
  const [visibleColumns, setVisibleColumns] = useState(
    new Set(INITIAL_VISIBLE_COLUMNS)
  );
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "username",
    direction: "ascending" as "ascending" | "descending",
  });
  const [page, setPage] = useState(1);

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = useMemo(() => {
    return columns.filter((column) =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns]);

  const filteredItems = useMemo(() => {
    let filteredUsers = [...users ?? []];

    if (hasSearchFilter) {
      filteredUsers = filteredUsers.filter((user) =>
        user.username.toLowerCase().includes(filterValue.toLowerCase()) ||
        `${user.name.first} ${user.name.middle ?? ""} ${user.name.last ?? ""}`.toLowerCase().includes(filterValue.toLowerCase()) ||
        user.metadata?.major.name.en.toLowerCase().includes(filterValue.toLowerCase()) ||
        user.metadata?.major.school.name.en.toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    return filteredUsers;
  }, [users, filterValue]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = useMemo(() => {
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

  const renderCell = useCallback(
    (item: User, columnKey: Key, index: number) => {
      const rowIndex = (page * rowsPerPage) - rowsPerPage + index;
      const cellValue = item[columnKey as keyof typeof item];

      switch (columnKey) {
        case "name":
          return `${item.name.first} ${item.name.middle ?? ""} ${item.name.last ?? ""}`;
        case "school":
          return item.metadata?.major?.school?.name?.en ?? "-";
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
                    onPress={() => { setActionText("Edit"); setModal(prev => ({...prev, add: true})); setUserIndex(rowIndex); }}
                  >
                    Edit
                  </DropdownItem>
                  <DropdownItem
                    key="reset"
                    className="text-danger"
                    color="danger"
                    startContent={<RotateCcw size="16px" />}
                    onPress={() => { setConfirmText("Reset"); setModal(prev => ({...prev, confirm: true})); setUserIndex(rowIndex) }}
                  >
                    Reset Password
                  </DropdownItem>
                  <DropdownItem
                    key="delete"
                    className="text-danger"
                    color="danger"
                    startContent={<Trash size="16px" />}
                    onPress={() => { setConfirmText("Delete"); setModal(prev => ({...prev, confirm: true})); setUserIndex(rowIndex); }}
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

          return cellValue as ReactNode;
      }
    },
    [page, selectedKeys]
  );

  const handleAdd = async (user: Partial<User>) => {
    let response;

    if (actionText === "Add") response = await createUser(user);
    if (actionText === "Edit") response = await updateUser(users[userIndex]._id, user);
    setModal(prev => ({...prev, add: false}));

    if (response) {
      await fetchUsers();
      addToast({
        title: "Add Successfully",
        description: "Data has added successfully",
        color: "success"
      });
    }
  };

  const handleImport = async (user: Partial<User>[]) => {
    let response;

    // uploadUser(user)
    setModal(prev => ({...prev, import: false}));

    if (response) {
      await fetchUsers();
      addToast({
        title: "Import Successfully",
        description: "Data has imported successfully",
        color: "success"
      });
    }
  };

  const handleExport = (fileName?: string) => {
    let temp = [];

    if (fileName) {
      temp = users.map((user) => ({
        username: user.username,
        first: user.name?.first,
        middle: user.name?.middle ?? "",
        last: user.name?.last ?? "",
        role: user.role?.name,
        school_en: user.metadata?.major.school.name.en ?? "",
        major_en: user.metadata?.major.name.en ?? "",
      }))
    } else {
      temp = [{
        "username": [],
        "first": [],
        "middle": [],
        "last": [],
        "role": [],
        "school_en": [],
        "major_en": [],
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
    setModal(prev => ({...prev, export: false}));
    addToast({
      title: "Export Successfully",
      description: "Data has exported successfully",
      color: "success"
    });
  }

  const handleConfirm = async () => {
    let response;

    if (confirmText === "Delete") {
      if (Array.from(selectedKeys).length > 0) {
        response = await deleteMultiple(Array.from(selectedKeys) as string[]);
      } else {
        response = await deleteUser(users[userIndex]._id)
      }
      setModal(prev => ({...prev, confirm: false}));
    } else {

      setModal(prev => ({...prev, confirm: false}));
    }

    if (response) {
      await fetchUsers();
      addToast({
        title: `${confirmText} Successfully`,
        description: `Data has ${confirmText.toLowerCase()} successfully`,
        color: "success"
      });
    }
  };

  return (
    <div>
      <TableContent
        capitalize={capitalize}
        columns={columns}
        filterValue={filterValue}
        filteredItems={filteredItems}
        headerColumns={headerColumns}
        page={page}
        pages={pages}
        renderCell={renderCell}
        selectedKeys={selectedKeys}
        setActionText={setActionText}
        setModal={setModal}
        setPage={setPage}
        setSelectedKeys={setSelectedKeys}
        setSortDescriptor={setSortDescriptor}
        setVisibleColumns={setVisibleColumns}
        sortDescriptor={sortDescriptor}
        sortedItems={sortedItems}
        visibleColumns={visibleColumns}
        onClear={() => {
          setFilterValue("");
          setPage(1);
        }}
        onNextPage={() => setPage((p) => p + 1)}
        onPreviousPage={() => setPage((p) => Math.max(1, p - 1))}
        onSearchChange={(val) => {
          setFilterValue(val);
          setPage(1);
        }}
      />

      {/* Add and Edit  */}
      <AddModal
        action={actionText}
        isOpen={modal.add}
        roleId={roleId}
        schools={schools}
        user={users[userIndex]}
        onAdd={handleAdd}
        onClose={() => setModal(prev => ({...prev, add: false}))}
      />

      {/* Import */}
      <ImportModal
        isOpen={modal.import}
        majors={majors}
        roleId={roleId}
        onClose={() => setModal(prev => ({...prev, import: false}))}
        onExportTemplate={() => handleExport()}
        onImport={handleImport}
      />

      {/* Export */}
      <ExportModal
        isOpen={modal.export}
        onClose={() => setModal(prev => ({...prev, export: false}))}
        onExport={handleExport}
      />

      {/* Delete & Reset */}
      <ConfirmationModal
        body={`Are you sure you want to ${confirmText.toLowerCase()} this user?`}
        confirmColor={'danger'}
        isOpen={modal.confirm}
        title={`${confirmText} user`}
        onClose={() => setModal(prev => ({...prev, confirm: false}))}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
