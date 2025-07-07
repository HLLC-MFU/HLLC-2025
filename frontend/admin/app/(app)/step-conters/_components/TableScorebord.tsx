import type { Selection, SortDescriptor } from '@heroui/react';

import React, {
  ChangeEvent,
  ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react';
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
  User as UserCard,
} from '@heroui/react';
import { ChevronDown, Search } from 'lucide-react';

import { StepsConters } from '@/types/step-conters';
import { School } from '@/types/school';
import { Major } from '@/types/major';

const columns = [
  { name: 'ID', uid: 'id' },
  { name: 'NAME', uid: 'name' },
  { name: 'SCHOOL', uid: 'school' },
  { name: 'STEPCOUNT', uid: 'stepCount', sortable: true },
];

type LeaderboardProps = {
  StepConterData?: StepsConters[];
  Schools: School[];
  Majors: Major[];
};

export default function Scoreboard({
  StepConterData,
  Schools,
  Majors,
}: LeaderboardProps) {
  const [filterValue, setFilterValue] = useState('');
  const [school, setSchool] = useState<Selection>('all');
  const [major, setMajor] = useState<Selection>('all');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'stepCount',
    direction: 'descending',
  });
  const [page, setPage] = useState(1);

  const pages = Math.ceil((StepConterData?.length || 0) / rowsPerPage);

  const hasSearchFilter = Boolean(filterValue);

  const filteredItems = useMemo(() => {
    let filteredUsers = [...(StepConterData ?? [])];

    if (hasSearchFilter) {
      filteredUsers = filteredUsers.filter((user) =>
        user.user.username
          .toString()
          .toLowerCase()
          .includes(filterValue.toLowerCase()),
      );
    }

    return filteredUsers;
  }, [StepConterData, filterValue, school]);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a: StepsConters, b: StepsConters) => {
      const first = a[sortDescriptor.column as keyof StepsConters] as number;
      const second = b[sortDescriptor.column as keyof StepsConters] as number;
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === 'descending' ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const indexedItems = sortedItems.map((item, i) => ({
    item,
    index: (page - 1) * rowsPerPage + i,
  }));

  const renderCell = useCallback(
    (user: StepsConters, columnKey: React.Key, index?: number): ReactNode => {
      const cellValue = user[columnKey as keyof StepsConters];
      const metadata = user.user.metadata;

      switch (columnKey) {
        case 'id':
          return (
            <>
              <p className="text-bold text-small capitalize">
                {index != null ? index + 1 : '-'}
              </p>
            </>
          );
        case 'name':
          return (
            <>
              <UserCard
                classNames={{ description: 'text-default-500' }}
                description={user.user.username}
                name={`${user.user.name.first} ${user.user.name?.middle || ''} ${user.user.name.last}`}
              />
            </>
          );
        case 'school':
          return (
            <div className="flex flex-col">
              <p className="text-bold text-small capitalize">
                {metadata && Array.isArray(metadata) && metadata[0]?.major?.school?.name?.en
                  ? metadata[0].major.school.name.en
                  : '-'}
              </p>

              <p className="text-bold text-tiny capitalize text-default-500">
                {metadata && Array.isArray(metadata) && metadata[0]?.major?.name?.en
                  ? metadata[0].major.name.en
                  : '-'}
              </p>
            </div>
          );

        case 'stepCount':
          return (
            <div className=" flex  items-center gap-2">
              <p className="text-bold capitalize text-default-500">
                {user.stepCount}
              </p>
            </div>
          );
        default:
          return typeof cellValue === 'object'
            ? JSON.stringify(cellValue)
            : cellValue;
      }
    },
    [],
  );

  const onRowsPerPageChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      setRowsPerPage(Number(e.target.value));
      setPage(1);
    },
    [],
  );

  const onSearchChange = useCallback((value?: string) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue('');
    }
  }, []);

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            classNames={{
              base: 'w-full sm:max-w-[44%]',
              inputWrapper: 'border-1',
            }}
            placeholder="Search by Student ID"
            size="sm"
            startContent={<Search className="text-default-300" />}
            value={filterValue}
            variant="bordered"
            onClear={() => setFilterValue('')}
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
                  major
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={major}
                selectionMode="single"
                onSelectionChange={setMajor}
              >
                {(Majors ?? []).map((major) => (
                  <DropdownItem
                    key={major._id ?? `major-${major.name.en}`}
                    className="capitalize"
                  >
                    {major.name.en}
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
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={school}
                selectionMode="single"
                onSelectionChange={setSchool}
              >
                {(Schools ?? []).map((Schools) => {
                  return (
                    <DropdownItem key={Schools._id} className="capitalize">
                      {Schools.name.en}
                    </DropdownItem>
                  );
                })}
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            Total {StepConterData?.length ?? 0} users
          </span>
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
    school,
    onSearchChange,
    onRowsPerPageChange,
    StepConterData?.length ?? 0,
    hasSearchFilter,
  ]);

  const bottomContent = useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <Pagination
          showControls
          classNames={{
            cursor: 'bg-foreground text-background',
          }}
          color="default"
          isDisabled={hasSearchFilter}
          page={page}
          total={pages}
          variant="light"
          onChange={setPage}
        />
      </div>
    );
  }, [items.length, page, pages, hasSearchFilter]);

  const classNames = useMemo(
    () => ({
      wrapper: ['max-h-[382px]', 'max-w-3xl'],
      th: ['bg-transparent', 'text-default-500', 'border-b', 'border-divider'],
      td: [
        // changing the rows border radius
        // first
        'group-data-[first=true]/tr:first:before:rounded-none',
        'group-data-[first=true]/tr:last:before:rounded-none',
        // middle
        'group-data-[middle=true]/tr:before:rounded-none',
        // last
        'group-data-[last=true]/tr:first:before:rounded-none',
        'group-data-[last=true]/tr:last:before:rounded-none',
      ],
    }),
    [],
  );

  return (
    <div className=" p-8 m-8 border rounded-xl">
      <Table
        isCompact
        removeWrapper
        aria-label="Example table with custom cells, pagination and sorting"
        bottomContent={bottomContent}
        bottomContentPlacement="outside"
        checkboxesProps={{
          classNames: {
            wrapper:
              'after:bg-foreground after:text-background text-background',
          },
        }}
        classNames={classNames}
        sortDescriptor={sortDescriptor}
        topContent={topContent}
        topContentPlacement="outside"
        onSortChange={setSortDescriptor}
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn
              key={column.uid}
              align={column.uid === 'actions' ? 'center' : 'start'}
              allowsSorting={column.sortable}
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody emptyContent={'No users found'} items={indexedItems}>
          {({ item, index }) => (
            <TableRow key={item._id}>
              {(columnKey) => (
                <TableCell>{renderCell(item, columnKey, index)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
