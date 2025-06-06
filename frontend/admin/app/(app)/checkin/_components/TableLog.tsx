<<<<<<<<< Temporary merge branch 1
import React from 'react';
=========
import React, { useEffect } from 'react';
>>>>>>>>> Temporary merge branch 2
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  User,
} from '@heroui/react';

import { Typing } from './TypingModal';
import { useCheckin } from '@/hooks/useCheckin';
import { useActivities } from '@/hooks/useActivities';

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
  activityId: string;
  activity: string;
  activityth: string;
  userId: string;
  [key: string]: string;
};

const INITIAL_VISIBLE_COLUMNS = ['name', 'activity'];

export function TableLog() {
<<<<<<<<< Temporary merge branch 1
  const [filterValue, setFilterValue] = React.useState('');
  const [selectedKeys, setSelectedKeys] = React.useState(new Set([]));
  const [visibleColumns, setVisibleColumns] = React.useState(
    new Set(INITIAL_VISIBLE_COLUMNS),
  );
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [sortDescriptor, setSortDescriptor] = React.useState({
    column: 'name',
=========

  const { checkin, fetchcheckin } = useCheckin();

  console.log(checkin);

  const [filterValue, setFilterValue] = useState('');
  const [selectedKeys] = useState(new Set([]));
  const [visibleColumns, setVisibleColumns] = useState(
    new Set(INITIAL_VISIBLE_COLUMNS),
  );
  const [rowsPerPage] = useState(5);
  const [sortDescriptor, setSortDescriptor] = useState<{ column: string; direction: 'ascending' | 'descending' }>({
    column: 'activity',
    direction: 'ascending',
  });
  const [page, setPage] = React.useState(1);
  const [isTypingModelOpen, setIsTypingModelOpen] = React.useState(false);
<<<<<<<<< Temporary merge branch 1
  const { checkin, fetchcheckin } = useCheckin();
  type Activity = { id: string; name: string };
  const [activity, setActivity] = React.useState<Activity[]>();
  const [activtyFilter, setActivityFilter] = React.useState<Set<string>>(
    new Set(),
  );
=========
  const [ activityFilter, setActivityFilter] = React.useState<Set<string>>(new Set());
  const { activities } = useActivity();
>>>>>>>>> Temporary merge branch 2

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = React.useMemo(() => {
<<<<<<<<< Temporary merge branch 1
    if (visibleColumns === 'all') return columns;

    return columns.filter(column =>
      Array.from(visibleColumns).includes(column.uid),
    );
  }, [visibleColumns]);

  useEffect(() => {
    const fecthActivity = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/activities');
        const json = await res.json();
        const activityList = json.data.map((activity: any) => ({
          id: activity._id,
          name: activity.shortName.en,
        }));

        setActivity(activityList);
        setActivityFilter(new Set(activityList.map((a: any) => a.id)));
      } catch (err) {
        console.error('Fetch failed', err);
      }
    };

    fecthActivity();
    fetchcheckin();

    const interval = setInterval(fetchcheckin, 3000); // ทุก 10 วินาที

    return () => clearInterval(interval);
  }, []);

  console.log(user);
  console.log('ค่ากิจกรรมในหน้าตาราง', activity);

  const users = React.useMemo(() => {
    return (Array.isArray(checkin) ? checkin : []).map(item => ({
      id: item._id,
      name: `${item.user.name.first} ${item.user.name.middle ?? ''} ${item.user.name.last}`.trim(),
      studentid: item.user.username,
      activityId: item.activities?.[0]?._id ?? '',
      activity: item.activities?.[0]?.fullName?.en ?? '-',
      activityth: item.activities?.[0]?.fullName?.th ?? '-',
    }));
  }, [checkin]);

  console.log('ข้อมูลร่วมตาราง', checkin);
=========
    return columns.filter(column => Array.from(visibleColumns).includes(column.uid));
  }, [visibleColumns]);

  const users = React.useMemo(() => {
    const seen = new Set<string>();

    return (Array.isArray(checkin) ? checkin : [])
  .flatMap((item) => {
    return (item.activities || []).map((activity) => ({
      id: item._id,
      name: `${item.user.name.first} ${item.user.name.middle ?? ''} ${item.user.name.last}`.trim(),
      studentid: item.user._id.toString(),
      activityId: activity?._id.toString(),
      activity: activity?.name?.en ?? 'Unknown',
      activityth: activity?.name?.th ?? 'ไม่ทราบ',
      userId: item.user._id,
    }));
  })
  .filter((user) => {
    const key = `${user.userId}_${user.activityId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  }, [checkin]);

  const filteredItems = useMemo(() => {
    let filteredUsers = [...users];

    if (hasSearchFilter) {
      filteredUsers = filteredUsers.filter(user =>
<<<<<<<<< Temporary merge branch 1
        user.name.toLowerCase().includes(filterValue.toLowerCase()),
      );
    }

    if (activtyFilter && activtyFilter.size > 0) {
      filteredUsers = filteredUsers.filter(user =>
        activtyFilter.has(user.activityId),
=========
        user.studentid.toLowerCase().includes(filterValue.toLowerCase()),
      );
    }

    if (activityFilter && activityFilter.size > 0) {
      filteredUsers = filteredUsers.filter((user) =>
        activityFilter.has(user.activityId),
      );
    }

    return filteredUsers;
  }, [users, filterValue, activityFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

  const items = useMemo(() => {
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

  const sortedItems = useMemo(() => {
    return [...items].sort((a : UserType, b : UserType) => {
      const first = a[sortDescriptor.column as keyof UserType];
      const second = b[sortDescriptor.column as keyof UserType];
      const cmp = first! < second! ? -1 : first! > second! ? 1 : 0;
      return sortDescriptor.direction === 'descending' ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

<<<<<<<<< Temporary merge branch 1
  const renderCell = React.useCallback((user, columnKey) => {
    const cellValue = user[columnKey];

=========
  const renderCell = React.useCallback((user: UserType, columnKey: string) => {
    const cellValue = user[columnKey];
    switch (columnKey) {
      case 'name':
        return (
          <User
            avatarProps={{ radius: 'lg', src: '' }}
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

  const onNextPage = useCallback(() => {
    if (page < pages) {
      setPage(page + 1);
    }
  }, [page, pages]);

  const onPreviousPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page]);

<<<<<<<<< Temporary merge branch 1
  const onRowsPerPageChange = React.useCallback(e => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);

  const onSearchChange = React.useCallback(value => {
=========

  const onSearchChange = React.useCallback((value: string) => {
>>>>>>>>> Temporary merge branch 2
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue('');
    }
  }, []);

  const onClear = useCallback(() => {
    setFilterValue('');
    setPage(1);
  }, []);

<<<<<<<<< Temporary merge branch 1
  const topContent = React.useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            className="w-full sm:max-w-[44%] "
            placeholder="Search by name..."
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
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={activtyFilter}
                selectionMode="multiple"
                onSelectionChange={setActivityFilter}
              >
                {(activity ?? []).map(activty => (
                  <DropdownItem key={activty.id} className="capitalize">
                    {capitalize(activty.name)}
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
=========
>>>>>>>>> Temporary merge branch 2

  return (
    <div className="container mx-auto flex justify-center items-center px-4 py-6">
      <Table
        isHeaderSticky
        aria-label="Example table with custom cells, pagination and sorting"
<<<<<<<<< Temporary merge branch 1
        bottomContent={bottomContent}
=========
        bottomContent={<BottomContent
          selectedCount={selectedKeys.size}
          totalCount={filteredItems.length}
          page={page}
          pages={pages}
          onPreviousPage={onPreviousPage}
          onNextPage={onNextPage}
          onPageChange={setPage}
        />}
>>>>>>>>> Temporary merge branch 2
        bottomContentPlacement="outside"
        classNames={{
          wrapper: 'max-h-none overflow-visible',
        }}
        sortDescriptor={sortDescriptor}
<<<<<<<<< Temporary merge branch 1
        topContent={topContent}
        topContentPlacement="outside"
        onSortChange={setSortDescriptor}
=========
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
          setSortDescriptor(descriptor as { column: string; direction: 'ascending' | 'descending' })
        }
      >
        <TableHeader columns={headerColumns}>
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
        <TableBody emptyContent={'No users found'} items={sortedItems}>
          {(item) => (
            <TableRow key={item.id}>
              {columnKey => (
<<<<<<<<< Temporary merge branch 1
                <TableCell>{renderCell(item, columnKey)}</TableCell>
=========
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
<<<<<<<<< Temporary merge branch 1
    </div>
=========
    </div >
>>>>>>>>> Temporary merge branch 2
  );
}
