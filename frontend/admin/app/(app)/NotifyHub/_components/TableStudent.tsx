import React, { useEffect } from "react";
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
  User,
  Pagination,
} from "@heroui/react";
import { useMajors } from "@/hooks/useMajor";

export const columns = [
  { name: "NAME", uid: "name", sortable: true },
  { name: "MAJOR", uid: "major", sortable: true },
];


import { ChevronDown, Search } from 'lucide-react';
import { useUsers } from "@/hooks/useUsers";
import { useSchools } from "@/hooks/useSchool";


export function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}


const INITIAL_VISIBLE_COLUMNS = ["name", "major"];

export function TableInfo() {
  const [filterValue, setFilterValue] = React.useState("");
  const [selectedKeys, setSelectedKeys] = React.useState(new Set([]));
  const [visibleColumns] = React.useState(new Set(INITIAL_VISIBLE_COLUMNS));
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [sortDescriptor, setSortDescriptor] = React.useState({
    column: "name",
    direction: "ascending",
  });
  const [page, setPage] = React.useState(1);
  const { users } = useUsers();
  const { majors } = useMajors();
  const { schools } = useSchools();
  const [majorFilter, setMajorFilter] = React.useState<Set<string>>(
    new Set(),
  );
  const [schoolFilter, setSchoolFilter] = React.useState<Set<string>>(
    new Set(),
  );


  console.log("Users data: ", users);
  console.log("Majors data: ", majors);
  console.log("Schools data: ", schools);


  const pages = Math.ceil(users.length / rowsPerPage);

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === "all") return columns;

    return columns.filter((column) => Array.from(visibleColumns).includes(column.uid));
  }, [visibleColumns]);


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
    return [...items].sort((a, b) => {
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
        .filter((m) => selectedSchoolIds.includes(m.school._id))
        .map((m) => m._id);

      // เซ็ตใหม่เฉพาะ major ของ school ที่เลือก
      setMajorFilter(new Set(filteredMajorIds));
    }

    if (schoolFilter.size === 0) {
      setMajorFilter(new Set());
    }

  }, [schoolFilter, majors]);


  const renderCell = React.useCallback((user, columnKey) => {
    const cellValue = columnKey === "name" ? user.name.full : user[columnKey];

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

  const topContent = React.useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            classNames={{
              base: "w-full sm:max-w-[44%]",
              inputWrapper: "border-1",
            }}
            placeholder="Search by Student Id"
            size="sm"
            startContent={<Search className="text-default-300" />}
            value={filterValue}
            variant="bordered"
            onClear={() => setFilterValue("")}
            onValueChange={onSearchChange}
          />
          <div className="flex gap-3">
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={<ChevronDown className="text-small" />}
                  size="sm"
                  variant="flat"
                >
                  Major
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Select Majors"
                closeOnSelect={false}
                selectedKeys={majorFilter}
                selectionMode="multiple"
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys) as string[];
                  setMajorFilter(new Set(selected));
                }}
              >
                {(majors ?? [])
                  .map((major) => (
                    <DropdownItem key={major._id} className="capitalize">
                      {capitalize(major.name.en)}
                    </DropdownItem>
                  ))}
              </DropdownMenu>
            </Dropdown>
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={<ChevronDown className="text-small" />}
                  size="sm"
                  variant="flat"
                >
                  School
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="select schools"
                closeOnSelect={false}
                selectionMode="multiple"
                selectedKeys={schoolFilter}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys) as string[];
                  setSchoolFilter(new Set(selected));
                }}
              >
                {(schools ?? [])
                  .map((school) => (
                    <DropdownItem key={school._id} className="capitalize">
                      {capitalize(school.name.en)}
                    </DropdownItem>
                  ))}
              </DropdownMenu>

            </Dropdown>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">Total {users.length} users</span>
          <label className="flex items-center text-default-400 text-small">
            Rows per page:
            <select
              className="bg-transparent outline-none text-default-400 text-small"
              onChange={onRowsPerPageChange}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
            </select>
          </label>
        </div>
      </div>
    );
  }, [
    filterValue,
    majorFilter,
    schoolFilter,
    visibleColumns,
    onSearchChange,
    onRowsPerPageChange,
    users.length,
    hasSearchFilter,
  ]);

  const bottomContent = React.useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <Pagination
          showControls
          classNames={{
            cursor: "bg-foreground text-background",
          }}
          color="default"
          isDisabled={hasSearchFilter}
          page={page}
          total={pages}
          variant="light"
          onChange={setPage}
        />
        <span className="text-small text-default-400">
          {selectedKeys === "all"
            ? "All items selected"
            : `${selectedKeys.size} of ${items.length} selected`}
        </span>
      </div>
    );
  }, [selectedKeys, items.length, page, pages, hasSearchFilter]);

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
      bottomContent={bottomContent}
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
      topContent={topContent}
      topContentPlacement="outside"
      onSelectionChange={(keys) => {
        if (keys === "all") {
          const filteredIds = filteredItems.map(user => user.id);
          setSelectedKeys(new Set(filteredIds));
        } else {
          setSelectedKeys(keys);
        }
      }}
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