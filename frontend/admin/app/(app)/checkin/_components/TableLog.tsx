import React, { useEffect } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  User,
  Pagination,
} from '@heroui/react';

import { Typing } from './TypingModal';
import { useCheckin } from '@/hooks/useCheckin';
import { useActivity } from '@/hooks/useActivity';

import TopContent from './Tablecomponents/Topcontent';
import BottomContent from './Tablecomponents/BottomContent';

export const columns = [
  { name: 'NAME', uid: 'name', sortable: true },
  { name: 'ACTIVITY', uid: 'activity', sortable: true },
];

export type UserType = {
  id: string;
  name: string;
  studentid: string;
  avatar: string;
  activityId: string;
  activity: string;
  activityth: string;
  userId: string;
  [key: string]: string | undefined; // Allow string indexing
};

const INITIAL_VISIBLE_COLUMNS = ['name', 'activity'];

export function TableLog() {

  const { checkin, fetchcheckin } = useCheckin();

  console.log(checkin);

  const [filterValue, setFilterValue] = React.useState('');
  const [selectedKeys] = React.useState(new Set([]));
  const [visibleColumns, setVisibleColumns] = React.useState(new Set(INITIAL_VISIBLE_COLUMNS));
  const [rowsPerPage] = React.useState(5);
  const [sortDescriptor, setSortDescriptor] = React.useState<{ column: string; direction: 'ascending' | 'descending' }>({
    column: 'activity',
    direction: 'ascending',
  });
  const [page, setPage] = React.useState(1);
  const [isTypingModelOpen, setIsTypingModelOpen] = React.useState(false);
  const [ activityFilter, setActivityFilter] = React.useState<Set<string>>(new Set());
  const { activities } = useActivity();

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = React.useMemo(() => {
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

    if (activityFilter && activityFilter.size > 0) {
      filteredUsers = filteredUsers.filter(user =>
        activityFilter.has(user.activityId),
      );
    }

    return filteredUsers;
  }, [users, filterValue, activityFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  useEffect(() => {
    if (activities.length > 0) {
      const allActivityIds = new Set(activities.map((a) => a._id));
      setActivityFilter(allActivityIds);
    }
  }, [activities]);

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof UserType];
      const second = b[sortDescriptor.column as keyof UserType];
      const cmp = first! < second! ? -1 : first! > second! ? 1 : 0;
      return sortDescriptor.direction === 'descending' ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const renderCell = React.useCallback((user: UserType, columnKey: string) => {
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


  const onSearchChange = React.useCallback((value: string) => {
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


  return (
    <div className="container mx-auto flex justify-center items-center px-4 py-6">
      <Table
        isHeaderSticky
        aria-label="Example table with custom cells, pagination and sorting"
        bottomContent={<BottomContent
          selectedCount={selectedKeys.size}
          totalCount={filteredItems.length}
          page={page}
          pages={pages}
          onPreviousPage={onPreviousPage}
          onNextPage={onNextPage}
          onPageChange={setPage}
        />}
        bottomContentPlacement="outside"
        classNames={{
          wrapper: 'max-h-none overflow-visible',
        }}
        sortDescriptor={sortDescriptor}
        topContent={< TopContent filterValue={filterValue}
          onClear={onClear}
          onSearchChange={onSearchChange}
          activityFilter={activityFilter}
          setActivityFilter={setActivityFilter}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          activities={activities}
          columns={columns}
          usersLength={users.length}
          onTypingPress={() => setIsTypingModelOpen(true)} />}
        topContentPlacement="outside"
        onSortChange={(descriptor) =>
          setSortDescriptor({
            column: String(descriptor.column),
            direction: descriptor.direction as 'ascending' | 'descending',
          })
        }
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
                <TableCell>{renderCell(item, String(columnKey))}</TableCell>
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
    </div >
  );
}
