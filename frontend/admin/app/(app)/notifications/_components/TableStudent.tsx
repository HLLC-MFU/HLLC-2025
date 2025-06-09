import React, { useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  User,
  SortDescriptor,
  Selection
} from "@heroui/react";
import { useMajors } from "@/hooks/useMajor";
import { useUsers } from "@/hooks/useUsers";
import { useSchools } from "@/hooks/useSchool";
import TopContent from "./Tablecomponents/TopContent";
import BottomContent from "./Tablecomponents/BottomContent";
import { FormattedUser } from "@/types/Notification/FomattedUser";
import { INITIAL_VISIBLE_COLUMNS, columns } from "@/types/Notification/TableNotification";

type SelectionScope = { type: "school" | "major" | "individual"; id: string[] };

export function TableInfo({
  onSelectionChange,
}: {
  onSelectionChange?: (scope: SelectionScope[]) => void;
}) {
  const [filterValue, setFilterValue] = React.useState("");
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(new Set<string>());
  const [visibleColumns] = React.useState(new Set(INITIAL_VISIBLE_COLUMNS));
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: "name",
    direction: "ascending",
  });
  const [page, setPage] = React.useState(1);
  const { users } = useUsers();
  const { majors } = useMajors();
  const { schools } = useSchools();
  const [majorFilter, setMajorFilter] = React.useState<Set<string>>(new Set(),);
  const [schoolFilter, setSchoolFilter] = React.useState<Set<string>>(new Set(),);
  const pages = Math.ceil(users.length / rowsPerPage);
  const hasSearchFilter = Boolean(filterValue);
  const headerColumns = React.useMemo(() => {
    return columns.filter((column) => Array.from(visibleColumns).includes(column.uid));
  }, [visibleColumns]);



  const handleSelectionChange = (keys: Selection) => {
    let selectedIds: string[] = [];

    if (keys === "all") {
      selectedIds = filteredItems.map((user) => user.id);
    } else {
      selectedIds = Array.from(keys).map(String);
    }

    setSelectedKeys(new Set(selectedIds));

    if (onSelectionChange) {
      const selectedUsers = filteredItems.filter((user) =>
        selectedIds.includes(user.id)
      );

      const allMajorIds = selectedUsers.map(u => u.majorId);
      const allSchoolIds = selectedUsers.map(u => u.schoolId);

      const uniqueMajorIds = Array.from(new Set(allMajorIds));
      const uniqueSchoolIds = Array.from(new Set(allSchoolIds));

      const scope: SelectionScope[] = [];

      // ✅ 1. ทุกคน major เดียวกัน
      if (uniqueMajorIds.length === 1) {
        scope.push({ type: "major", id: [uniqueMajorIds[0]] });

        // ✅ 2. ไม่ใช่ major เดียวกัน แต่ school เดียวกัน
      } else if (uniqueSchoolIds.length === 1) {
        scope.push({ type: "school", id: [uniqueSchoolIds[0]] });

        // ❌ 3. กระจัดกระจาย
      } else {
        scope.push({ type: "individual", id: selectedIds });
      }

      onSelectionChange(scope);
    }
  };

  const formatted = React.useMemo(() => {
    return (Array.isArray(users) ? users : [])
      .filter(user => user.role?.name !== 'Administrator')
      .map(item => {
        const metadataArray = Array.isArray(item.metadata)
          ? item.metadata
          : [item.metadata];

        const majorObj = metadataArray?.[0]?.major;
        const major = metadataArray?.[0]?.major?.name?.en ?? '-';
        const schoolObj = metadataArray?.[0]?.major?.school;
        const school = metadataArray[0]?.major?.school?.name?.en ?? '-';

        return {
          id: item._id,
          name: `${item.name?.first ?? ''} ${item.name?.middle ?? ''} ${item.name?.last ?? ''}`.trim(),
          studentid: item.username,
          major,
          majorId: majorObj?._id ?? '',
          school,
          schoolId: schoolObj?._id ?? '',
        };
      });
  }, [users]);


  const filteredItems = React.useMemo(() => {
    let filteredUsers = [...formatted];

    if (hasSearchFilter) {
      filteredUsers = filteredUsers.filter((user) =>
        user.studentid.toLowerCase().includes(filterValue.toLowerCase()),
      );
    }


    if (majorFilter && majorFilter.size > 0) {
      filteredUsers = filteredUsers.filter(user =>
        majorFilter.has(user.majorId),
      );
    }

    if (schoolFilter && schoolFilter.size > 0) {
      filteredUsers = filteredUsers.filter(user =>
        schoolFilter.has(user.schoolId),
      );
    }

    return filteredUsers;
  }, [formatted, filterValue, majorFilter, schoolFilter]);


  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a: any, b: any) => {
      const first = a[sortDescriptor.column];
      const second = b[sortDescriptor.column];
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  useEffect(() => {
    if (schoolFilter.size > 0 && majors.length > 0) {
      // เก็บ school id ที่เลือกไว้
      const selectedSchoolIds = Array.from(schoolFilter);

      // กรอง majors ที่ belong กับ school ที่เลือก
      const filteredMajorIds = majors
        .filter((m) => selectedSchoolIds.includes(m.school))
        .map((m) => m._id)
        .filter((id): id is string => typeof id === "string" && id.length > 0);

      // เซ็ตใหม่เฉพาะ major ของ school ที่เลือก
      setMajorFilter(new Set(filteredMajorIds));
    }

    if (schoolFilter.size === 0) {
      setMajorFilter(new Set());
    }

  }, [schoolFilter, majors]);

  const renderCell = React.useCallback((user: FormattedUser, columnKey: keyof FormattedUser | "name" | "major") => {
    const cellValue = columnKey === "name" ? user.name : user[columnKey as keyof FormattedUser];

    switch (columnKey) {
      case "name":
        return (
          <User
            avatarProps={{ radius: "full", size: "sm", src: user.avatar }}
            classNames={{
              description: "text-default-500",
            }}
            description={user.studentid}
            name={user.name}
          >
            {user.name}
          </User>
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

  const classNames = React.useMemo(
    () => ({
      wrapper: ["max-h-[382px]", "max-w-3xl"],
      th: ["bg-transparent", "text-default-500", "border-b", "border-divider"],
      td: [
        // changing the rows border radius
        // first
        "group-data-[first=true]/tr:first:before:rounded-none",
        "group-data-[first=true]/tr:last:before:rounded-none",
        // middle
        "group-data-[middle=true]/tr:before:rounded-none",
        // last
        "group-data-[last=true]/tr:first:before:rounded-none",
        "group-data-[last=true]/tr:last:before:rounded-none",
      ],
    }),
    [],
  );

  return (
    <Table
      isCompact
      removeWrapper
      aria-label="Example table with custom cells, pagination and sorting"
      bottomContent={<BottomContent
        page={page}
        pages={pages}
        setPage={setPage}
        selectedKeys={selectedKeys}
        items={filteredItems}
        hasSearchFilter={hasSearchFilter} />}
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
      topContent={<TopContent
        filterValue={filterValue}
        onSearchChange={onSearchChange}
        onClear={() => setFilterValue("")}
        majorFilter={majorFilter}
        setMajorFilter={setMajorFilter}
        schoolFilter={schoolFilter}
        setSchoolFilter={setSchoolFilter}
        majors={majors}
        schools={schools}
        usersLength={users.length}
        onRowsPerPageChange={onRowsPerPageChange}
      />}
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