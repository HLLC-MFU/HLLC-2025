import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, User, SortDescriptor, Selection } from "@heroui/react";
import { columns , INITIAL_VISIBLE_COLUMNS , FormattedUser , SelectionScope } from "../_types/modal";
import { useMajors } from "@/hooks/useMajor";
import { useUsers } from "@/hooks/useUsers";
import { useSchools } from "@/hooks/useSchool";
import TopContent from "./TableStudent/TableStudentTopContent";
import BottomContent from "./TableStudent/TableStudentBottomContent";

export function TableInfo({ onSelectionChange }: { onSelectionChange?: (scope: SelectionScope[]) => void; }) {
  const [filterValue, setFilterValue] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [visibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS));
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({ column: "name", direction: "ascending" });
  const [page, setPage] = useState(1);
  const { users } = useUsers();
  const { majors } = useMajors();
  const { schools } = useSchools();
  const [majorFilter, setMajorFilter] = useState<Set<string>>(new Set());
  const [schoolFilter, setSchoolFilter] = useState<Set<string>>(new Set());

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = useMemo(() => {
    return columns.filter(column => Array.from(visibleColumns).includes(column.uid));
  }, [visibleColumns]);

  const formatted = useMemo<FormattedUser[]>(() => {
    return (Array.isArray(users) ? users : [])
      .filter(user => user.role?.name !== 'Administrator')
      .map(item => {
        const metadataArray = Array.isArray(item.metadata) ? item.metadata : [item.metadata];
        const majorObj = metadataArray?.[0]?.major;
        const schoolObj = metadataArray?.[0]?.major?.school;

        return {
          id: item._id,
          name: `${item.name?.first ?? ''} ${item.name?.middle ?? ''} ${item.name?.last ?? ''}`.trim(),
          studentid: item.username,
          major: majorObj?.name?.en ?? '-',
          majorId: majorObj?._id ?? '',
          school: schoolObj?.name?.en ?? '-',
          schoolId: schoolObj?._id ?? '',
        };
      });
  }, [users]);

  const filteredItems = useMemo(() => {
    let filtered = [...formatted];

    if (hasSearchFilter) {
      filtered = filtered.filter(user =>
        (user.studentid ?? '').toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    if (majorFilter.size > 0) {
      filtered = filtered.filter(user => majorFilter.has(user.majorId));
    }

    if (schoolFilter.size > 0) {
      filtered = filtered.filter(user => schoolFilter.has(user.schoolId));
    }

    return filtered;
  }, [formatted, filterValue, majorFilter, schoolFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const pagedItems = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredItems.slice(start, start + rowsPerPage);
  }, [page, rowsPerPage, filteredItems]);

  const sortedItems = useMemo(() => {
    return [...pagedItems].sort((a: FormattedUser, b: FormattedUser) => {
      const first = a[sortDescriptor.column as keyof FormattedUser] ?? '';
      const second = b[sortDescriptor.column as keyof FormattedUser] ?? '';
      const cmp = first < second ? -1 : first > second ? 1 : 0;
      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, pagedItems]);

  useEffect(() => {
    if (schoolFilter.size > 0 && majors.length > 0) {
      const selectedSchoolIds = Array.from(schoolFilter);
      const filteredMajorIds = majors
        .filter(m => {
          if (typeof m.school === "object" && m.school !== null && "_id" in m.school) {
            return selectedSchoolIds.includes((m.school as { _id: string })._id ?? '');
          }
          return false;
        })
        .map(m => m._id)
        .filter((id): id is string => typeof id === "string" && id.length > 0);
      setMajorFilter(new Set(filteredMajorIds));
    } else {
      setMajorFilter(new Set());
    }
  }, [schoolFilter, majors]);

  const handleSelectionChange = (keys: Selection) => {
    let selectedIds: string[] = [];

    if (keys === "all") {
      selectedIds = filteredItems.map(user => user.id);
    } else {
      selectedIds = Array.from(keys).map(String);
    }

    setSelectedKeys(new Set(selectedIds));

    if (onSelectionChange) {
      const selectedUsers = filteredItems.filter(user => selectedIds.includes(user.id));

      if (selectedUsers.length === 1) {
        onSelectionChange([{ type: "individual", id: selectedIds }]);
        return;
      }

      const majorIds = selectedUsers.map(u => u.majorId).filter(Boolean);
      const uniqueMajorIds = Array.from(new Set(majorIds));

      const schoolIds = selectedUsers.map(u => u.schoolId).filter(Boolean);
      const uniqueSchoolIds = Array.from(new Set(schoolIds));

      if (uniqueMajorIds.length === 1) {
        onSelectionChange([{ type: "major", id: uniqueMajorIds }]);
        return;
      }

      if (uniqueSchoolIds.length === 1) {
        onSelectionChange([{ type: "school", id: uniqueSchoolIds }]);
        return;
      }

      onSelectionChange([{ type: "individual", id: selectedIds }]);
    }
  };

  const renderCell = useCallback((user: FormattedUser, columnKey: keyof FormattedUser | "name" | "major") => {
    const cellValue = columnKey === "name" ? user.name : user[columnKey as keyof FormattedUser];

    switch (columnKey) {
      case "name":
        return (
          <User
            avatarProps={{ radius: "full", size: "sm", src: user.avatar }}
            classNames={{ description: "text-default-500" }}
            description={user.studentid}
            name={user.name}
          />
        );
      case "major":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">{user.school}</p>
            <p className="text-bold text-tiny capitalize text-default-500">{user.major}</p>
          </div>
        );
      default:
        return cellValue;
    }
  }, []);

  const onRowsPerPageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);

  const onSearchChange = useCallback((value: string) => {
    setFilterValue(value || "");
    setPage(1);
  }, []);

  const classNames = useMemo(() => ({
    wrapper: ["max-h-[382px]", "max-w-3xl"],
    th: ["bg-transparent", "text-default-500", "border-b", "border-divider"],
    td: [
      "group-data-[first=true]/tr:first:before:rounded-none",
      "group-data-[first=true]/tr:last:before:rounded-none",
      "group-data-[middle=true]/tr:before:rounded-none",
      "group-data-[last=true]/tr:first:before:rounded-none",
      "group-data-[last=true]/tr:last:before:rounded-none",
    ],
  }), []);

  return (
    <Table
      isCompact
      removeWrapper
      aria-label="Example table with custom cells, pagination and sorting"
      bottomContent={
        <BottomContent
          page={page}
          pages={pages}
          setPage={setPage}
          selectedKeys={selectedKeys}
          items={filteredItems}
          hasSearchFilter={hasSearchFilter}
        />
      }
      bottomContentPlacement="outside"
      checkboxesProps={{
        classNames: {
          wrapper: "after:bg-foreground after:text-background text-background",
        },
      }}
      classNames={classNames}
      selectedKeys={selectedKeys}
      selectionMode="multiple"
      sortDescriptor={sortDescriptor}
      topContent={
        <TopContent
          filterValue={filterValue}
          onSearchChange={onSearchChange}
          onClear={() => setFilterValue("")}
          majorFilter={majorFilter}
          setMajorFilter={setMajorFilter}
          schoolFilter={schoolFilter}
          setSchoolFilter={setSchoolFilter}
          majors={majors}
          schools={schools}
          usersLength={filteredItems.length}
          onRowsPerPageChange={onRowsPerPageChange}
        />
      }
      topContentPlacement="outside"
      onSelectionChange={handleSelectionChange}
      onSortChange={setSortDescriptor}
    >
      <TableHeader columns={headerColumns}>
        {(column) => (
          <TableColumn
            key={column.uid}
            align={column.uid === "actions" ? "center" : "start"}
            allowsSorting={column.sortable}
          >
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody emptyContent={"No users found"} items={sortedItems}>
        {(item) => (
          <TableRow key={item.id}>
            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
