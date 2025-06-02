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

const INITIAL_VISIBLE_COLUMNS = [
  "username",
  "name",
  "school",
  "major",
  "actions",
];

export default function UsersTable({
  roleName,
  users,
}: {
  roleName: string;
  users: User[];
}) {
  const [filterValue, setFilterValue] = React.useState("");
  const [selectedKeys, setSelectedKeys] = React.useState<"all" | Set<unknown>>(
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
    if (visibleColumns === "all") return columns;
    return columns.filter((column) =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns]);

  const filteredItems = React.useMemo(() => {
    let filteredUsers = [...users ?? []];
    if (hasSearchFilter) {
      filteredUsers = filteredUsers.filter((user) =>
        user.username.toLowerCase().includes(filterValue.toLowerCase())
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

      if (first === null && second === null) return 0;
      if (first === null) return sortDescriptor.direction === "descending" ? 1 : -1;
      if (second === null) return sortDescriptor.direction === "descending" ? -1 : 1;

      const cmp = first < second ? -1 : first > second ? 1 : 0;
      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const renderCell = React.useCallback(
    (item: User, columnKey: React.Key, index: number) => {
      const cellValue = item[columnKey as keyof typeof item];
      switch (columnKey) {
        case "name":
          return `${item.name.first} ${item.name.middle ?? ""} ${item.name.last}`;
        case "school":
          return item.metadata?.[0]?.school?.name?.en ?? "-";
        case "major":
          return item.metadata?.[0]?.major?.name?.en ?? "-";
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
                    onPress={() => alert("Edit clicked for: " + item.username)}
                  >
                    Edit
                  </DropdownItem>
                  <DropdownItem
                    key="delete"
                    startContent={<Trash size="16px" />}
                    className="text-danger"
                    color="danger"
                    onPress={() => alert("Delete clicked for: " + item.username)}
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
    [page]
  );

  return (
    <div>
      <TableContent
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
        onRowsPerPageChange={(e) => {
          setRowsPerPage(Number(e.target.value));
          setPage(1);
        }}
      />
    </div>
  );
}
