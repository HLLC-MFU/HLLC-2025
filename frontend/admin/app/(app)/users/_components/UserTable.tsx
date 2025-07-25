"use client";

import React, { useCallback, Key, ReactNode, SetStateAction, useState, useMemo, } from "react";
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
import { School } from "@/types/school";
import { Major } from "@/types/major";

type ModalProps = {
  add: boolean;
  import: boolean;
  export: boolean;
  confirm: boolean;
};

type ColumnProps = {
  name: string;
  uid: string;
  sortable: boolean;
} | {
  name: string;
  uid: string;
  sortable?: undefined;
};

export default function UsersTable({
  roleId,
  majors,
  users,
  schools,
  modal,
  setModal,
  actionMode,
  setActionMode,
  confirmMode,
  setConfirmMode,
  capitalize,
  columns,
  initialVisibleColumns,
  selectedUser,
  setSelectedUser,
  onAdd,
  onImport,
  onConfirm,
  onRoleEdit,
  onRoleDelete,
}: {
  roleId: string;
  majors: Major[];
  users: User[];
  schools: School[];
  modal: ModalProps;
  setModal: (value: SetStateAction<ModalProps>) => void;
  actionMode: "Add" | "Edit";
  setActionMode: (value: "Add" | "Edit") => void;
  confirmMode: "Reset" | "Delete";
  setConfirmMode: (value: "Reset" | "Delete") => void;
  capitalize: (s: string) => string;
  columns: ColumnProps[];
  initialVisibleColumns: string[],
  selectedUser: User | null;
  setSelectedUser: (user: User) => void;
  onAdd: (user: Partial<User>, userAction?: User) => Promise<void>;
  onImport: (user: Partial<User>[]) => Promise<void>;
  onConfirm: () => void;
  onRoleEdit?: () => void;
  onRoleDelete?: () => void;
}) {
  const [filterValue, setFilterValue] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<"all" | Set<string | number>>(
    new Set([])
  );
  const [visibleColumns, setVisibleColumns] = useState(
    new Set(initialVisibleColumns)
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
        typeof user.metadata?.major === "object" && (
          user.username.toLowerCase().includes(filterValue.toLowerCase()) ||
          `${user.name.first} ${user.name.middle ?? ""} ${user.name.last ?? ""}`.toLowerCase().includes(filterValue.toLowerCase()) ||
          user.metadata?.major?.name.en.toLowerCase().includes(filterValue.toLowerCase()) ||
          (user.metadata?.major?.school as School).name.en.toLowerCase().includes(filterValue.toLowerCase())
        ));
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
    (item: User, columnKey: Key) => {
      const cellValue = item[columnKey as keyof typeof item];

      switch (columnKey) {
        case "name":
          return `${item.name.first} ${item.name.middle ?? ""} ${item.name.last ?? ""}`;
        case "school":
          if (typeof item.metadata?.major === "object") return (item.metadata?.major?.school as School)?.name?.en ?? "-";
        case "major":
          if (typeof item.metadata?.major === "object") return item.metadata?.major?.name?.en ?? "-";
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
                    onPress={() => { setActionMode("Edit"); setModal(prev => ({ ...prev, add: true })); setSelectedUser(item) }}
                  >
                    Edit
                  </DropdownItem>
                  <DropdownItem
                    key="reset"
                    className="text-danger"
                    color="danger"
                    startContent={<RotateCcw size="16px" />}
                    onPress={() => { setConfirmMode("Reset"); setModal(prev => ({ ...prev, confirm: true })); setSelectedUser(item) }}
                  >
                    Reset Password
                  </DropdownItem>
                  <DropdownItem
                    key="delete"
                    className="text-danger"
                    color="danger"
                    startContent={<Trash size="16px" />}
                    onPress={() => { setConfirmMode("Delete"); setModal(prev => ({ ...prev, confirm: true })); setSelectedUser(item); }}
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

  const handleExport = (fileName?: string) => {
    const temp = fileName
      ? users.map((user) => (
        typeof user.metadata?.major === "object" && typeof user.role === "object" && {
          username: user.username,
          first: user.name?.first,
          middle: user.name?.middle ?? "",
          last: user.name?.last ?? "",
          role: user.role?.name,
          school: (user.metadata?.major?.school as School).name.en ?? "",
          major: user.metadata?.major?.name.en ?? "",
        }))
      : [{
        "username": [],
        "first": [],
        "middle": [],
        "last": [],
        "role": [],
        "school": [],
        "major": [],
      }];

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
    setModal(prev => ({ ...prev, export: false }));
    addToast({
      title: "Export Successfully",
      description: "Data has exported successfully",
      color: "success"
    });
  }

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
        setActionMode={setActionMode}
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
        onRoleEdit={onRoleEdit}
        onRoleDelete={onRoleDelete}
      />

      {/* Add and Edit  */}
      <AddModal
        action={actionMode}
        isOpen={modal.add}
        majors={majors}
        roleId={roleId}
        schools={schools}
        user={selectedUser}
        userAction={selectedUser}
        onAdd={onAdd}
        onClose={() => setModal(prev => ({ ...prev, add: false }))}
      />

      {/* Import */}
      <ImportModal
        isOpen={modal.import}
        majors={majors}
        roleId={roleId}
        onClose={() => setModal(prev => ({ ...prev, import: false }))}
        onExportTemplate={() => handleExport()}
        onImport={onImport}
      />

      {/* Export */}
      <ExportModal
        isOpen={modal.export}
        onClose={() => setModal(prev => ({ ...prev, export: false }))}
        onExport={handleExport}
      />

      {/* Delete & Reset */}
      <ConfirmationModal
        body={`Are you sure you want to ${confirmMode.toLowerCase()} this user?`}
        confirmColor={'danger'}
        isOpen={modal.confirm}
        title={`${confirmMode} user ${selectedUser ? selectedUser.username : ""}`}
        onClose={() => setModal(prev => ({ ...prev, confirm: false }))}
        onConfirm={onConfirm}
      />
    </div>
  );
}
