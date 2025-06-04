import React, { useEffect } from 'react';
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
} from '@heroui/react';

import { Typing } from './TypingModal';
import { Search, ChevronDown, Plus } from 'lucide-react';
import { useCheckin } from '@/hooks/useCheckin';
import { useActivity } from '@/hooks/useActivity';

export const columns = [
  { name: 'NAME', uid: 'name', sortable: true },
  { name: 'ACTIVITY', uid: 'activity', sortable: true },
];

export function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
}

const INITIAL_VISIBLE_COLUMNS = ['name', 'activity'];

export function TableLog() {
  const [filterValue, setFilterValue] = React.useState('');
  const [selectedKeys, setSelectedKeys] = React.useState(new Set([]));
  const [visibleColumns, setVisibleColumns] = React.useState(new Set(INITIAL_VISIBLE_COLUMNS));
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [sortDescriptor, setSortDescriptor] = React.useState({
    column: 'activity',
    direction: 'ascending',
  });
  const [page, setPage] = React.useState(1);
  const [isTypingModelOpen, setIsTypingModelOpen] = React.useState(false);
  const { checkin, fetchcheckin } = useCheckin();
  const [activtyFilter, setActivityFilter] = React.useState<Set<string>>(new Set());
  const { activities } = useActivity();

  

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === 'all') return columns;
    return columns.filter(column => Array.from(visibleColumns).includes(column.uid));
  }, [visibleColumns]);

  const users = React.useMemo(() => {
    const seen = new Set<string>();

    return (Array.isArray(checkin) ? checkin : [])
      .map(item => {
        const activity = item.activities?.[0];
        return {
          id: item._id,
          name: `${item.user.name.first} ${item.user.name.middle ?? ''} ${item.user.name.last}`.trim(),
          studentid: item.user.username,
          avatar: item.user.avatar ?? '',
          activityId: activity?._id ?? '',
          activity: activity?.shortName.en ?? 'Unknown',
          activityth: activity?.shortName.th ?? 'ไม่ทราบ',
          userId: item.user._id,
        };
      })
      .filter(user => {
        const key = `${user.userId}_${user.activityId}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [checkin]);

  const filteredItems = React.useMemo(() => {
    let filteredUsers = [...users];

    if (hasSearchFilter) {
      filteredUsers = filteredUsers.filter(user =>
        user.studentid.toLowerCase().includes(filterValue.toLowerCase()),
      );
    }

    if (activtyFilter && activtyFilter.size > 0) {
      filteredUsers = filteredUsers.filter(user =>
        activtyFilter.has(user.activityId),
      );
    }

    return filteredUsers;
  }, [users, filterValue, activtyFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

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
      return sortDescriptor.direction === 'descending' ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const renderCell = React.useCallback((user, columnKey) => {
    const cellValue = user[columnKey];

    switch (columnKey) {
      case 'name':
        return (
          <User
            avatarProps={{ radius: 'lg', src: user.avatar }}
            description={user.studentid}
            name={cellValue}
          >
            {user.name}
          </User>
        );
      case 'activity':
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">{cellValue}</p>
            <p className="text-bold text-tiny capitalize text-default-400">
              {user.activityth}
            </p>
          </div>
        );
      default:
        return cellValue;
    }
  }, []);

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

  const onRowsPerPageChange = React.useCallback(e => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);

  const onSearchChange = React.useCallback(value => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue('');
    }
  }, []);

  const onClear = React.useCallback(() => {
    setFilterValue('');
    setPage(1);
  }, []);

  const topContent = React.useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            className="w-full sm:max-w-[44%] "
            placeholder="Search by StudentID..."
            startContent={<Search />}
            value={filterValue}
            onClear={() => onClear()}
            onValueChange={onSearchChange}
          />
          <div className="flex gap-3">
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={<ChevronDown className="text-small" />}
                  variant="flat"
                >
                  Activity
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Activity Filter"
                closeOnSelect={false}
                selectedKeys={activtyFilter}
                selectionMode="multiple"
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys) as string[];
                  setActivityFilter(new Set(selected));
                }}
              >
                {(activities ?? []).map((activty) => (
                  <DropdownItem key={String(activty._id)} className="capitalize">
                    {capitalize(activty.shortName?.en ?? activty.name ?? 'Untitled')}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={<ChevronDown className="text-small" />}
                  variant="flat"
                >
                  Columns
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={visibleColumns}
                selectionMode="multiple"
                onSelectionChange={setVisibleColumns}
              >
                {columns.map(column => (
                  <DropdownItem key={column.uid} className="capitalize">
                    {capitalize(column.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Button
              color="primary"
              endContent={<Plus />}
              onPress={() => setIsTypingModelOpen(true)}
            >
              Typing
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            Total {users.length} users
          </span>
        </div>
      </div>
    );
  }, [
    filterValue,
    activtyFilter,
    visibleColumns,
    onRowsPerPageChange,
    users.length,
    onSearchChange,
    hasSearchFilter,
  ]);

  const bottomContent = React.useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="w-[30%] text-small text-default-400">
          {selectedKeys === 'all'
            ? 'All items selected'
            : `${selectedKeys.size} of ${filteredItems.length} selected`}
        </span>
        <Pagination
          isCompact
          showControls
          showShadow
          color="primary"
          page={page}
          total={pages}
          onChange={setPage}
        />
        <div className="hidden sm:flex w-[30%] justify-end gap-2">
          <Button
            isDisabled={pages === 1}
            size="sm"
            variant="flat"
            onPress={onPreviousPage}
          >
            Previous
          </Button>
          <Button
            isDisabled={pages === 1}
            size="sm"
            variant="flat"
            onPress={onNextPage}
          >
            Next
          </Button>
        </div>
      </div>
    );
  }, [selectedKeys, items.length, page, pages, hasSearchFilter]);

  return (
    <div className="container mx-auto flex justify-center items-center px-4 py-6">
      <Table
        isHeaderSticky
        aria-label="Example table with custom cells, pagination and sorting"
        bottomContent={bottomContent}
        bottomContentPlacement="outside"
        classNames={{
          wrapper: 'max-h-none overflow-visible',
        }}
        sortDescriptor={sortDescriptor}
        topContent={topContent}
        topContentPlacement="outside"
        onSortChange={setSortDescriptor}
      >
        <TableHeader columns={headerColumns}>
          {column => (
            <TableColumn
              key={column.uid}
              align={column.uid === 'actions' ? 'center' : 'start'}
              allowsSorting={column.sortable}
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody emptyContent={'No users found'} items={sortedItems}>
          {item => (
            <TableRow key={item.id}>
              {columnKey => (
                <TableCell>{renderCell(item, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Typing
        isOpen={isTypingModelOpen}
        onClose={() => {
          fetchcheckin();
          setIsTypingModelOpen(false);
        }}
      />
    </div>
  );
}
