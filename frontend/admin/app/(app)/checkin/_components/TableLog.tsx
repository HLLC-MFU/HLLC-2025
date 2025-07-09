import type { Checkin } from '@/types/checkin';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  User as UserComponent,
  addToast,
} from '@heroui/react';

import { Typing } from './TypingModal';
import TopContent from './Tablecomponents/Topcontent';
import BottomContent from './Tablecomponents/BottomContent';

import { useCheckin } from '@/hooks/useCheckin';
import { useActivities } from '@/hooks/useActivities';
import { useUsers } from '@/hooks/useUsers';


interface TableItem {
  id: string;
  name: string;
  studentid: string;
  activityId: string;
  activityNameEn: string;
  activityNameTh: string;
  userId: string;
}

export const columns = [
  { name: 'NAME', uid: 'name', sortable: true },
  { name: 'ACTIVITY', uid: 'activity', sortable: true },
];

const INITIAL_VISIBLE_COLUMNS = ['name', 'activity'];

export function TableLog() {
  const { checkin, fetchcheckin, createcheckin, loading } = useCheckin();
  const { activities, fetchCanCheckin } = useActivities();
  const { users } = useUsers();
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [filterValue, setFilterValue] = useState('');
  const [selectedKeys] = useState(new Set([]));
  const [visibleColumns, setVisibleColumns] = useState(
    new Set(INITIAL_VISIBLE_COLUMNS),
  );
  const [rowsPerPage] = useState(5);

  useState<{ column: string; direction: 'ascending' | 'descending' }>({
    column: 'activity',
    direction: 'ascending',
  });
  const [page, setPage] = useState(1);
  const [isTypingModelOpen, setIsTypingModelOpen] = useState(false);
  const [activityFilter, setActivityFilter] = useState<Set<string>>(new Set());
  const [sortDescriptor, setSortDescriptor] = useState<{ column: string; direction: 'ascending' | 'descending' }>({
    column: 'activity',
    direction: 'ascending',
  });
  const hasSearchFilter = Boolean(filterValue);
  const headerColumns = useMemo(() => {
    return columns.filter((column) =>
      Array.from(visibleColumns).includes(column.uid),
    );
  }, [visibleColumns]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;

    return users.filter(user => 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${user.name.first} ${user.name.last}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const usersMemo = useMemo(() => {
    const seen = new Set<string>();

    return (Array.isArray(checkin) ? checkin : [])
      .map((item: Checkin) => {
        const activity = item.activities?.[0];

        return {
          id: item._id,
          name: `${item.user.name.first} ${item.user.name.middle ?? ''} ${item.user.name.last}`.trim(),
          studentid: item.user.username,
          activityId: activity?._id ?? '',
          activity: activity?.shortName?.en ?? 'Unknown',
          activityth: activity?.shortName?.th ?? 'ไม่ทราบ',
          userId: item.user._id,
        };
      })
      .filter((user) => {
        const key = `${user.userId}_${user.activityId}`;

        if (seen.has(key)) return false;
        seen.add(key);

        return true;
      });
  }, [checkin]);

  const filteredItems = useMemo(() => {
    let filteredUsers = [...usersMemo];

    if (hasSearchFilter) {
      filteredUsers = filteredUsers.filter((user) =>
        user.studentid.toLowerCase().includes(filterValue.toLowerCase()),
      );
    }

    if (activityFilter && activityFilter.size > 0) {
      filteredUsers = filteredUsers.filter((user) =>
        activityFilter.has(user.activityId),
      );
    }

    return filteredUsers;
  }, [usersMemo, filterValue, activityFilter]);

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
    return [...items].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof typeof a];
      const second = b[sortDescriptor.column as keyof typeof b];
      const cmp = first! < second! ? -1 : first! > second! ? 1 : 0;

      return sortDescriptor.direction === 'descending' ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const renderCell = useCallback((item: TableItem, columnKey: string) => {
    const cellValue = item[columnKey as keyof TableItem] ?? '';

    switch (columnKey) {
      case 'name':
        return (
          <UserComponent
            avatarProps={{ radius: 'lg', src: '' }}
            description={item.studentid}
            name={item.name}
          >
            {item.name}
          </UserComponent>
        );
      case 'activity':
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">{item.activityNameEn}</p>
            <p className="text-bold text-tiny capitalize text-default-400">
              {item.activityNameTh}
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

  const resetModalState = () => {
    setSelectedUserId('');
    setSelectedActivityIds([]);
    setSearchQuery('');
  };

  const handleCloseModal = () => {
    resetModalState();
    setIsManualModalOpen(false);
  };

  const handleManualCheckin = async () => {
    if (!selectedUserId) {
      addToast({
        title: "Error",
        description: "Please select a user",
        color: "danger"
      });

      return;
    }

    if (selectedActivityIds.length === 0) {
      addToast({
        title: "Error",
        description: "Please select at least one activity",
        color: "danger"
      });

      return;
    }

    try {
      await createcheckin({
        user: selectedUserId,
        activities: selectedActivityIds,
      });
      handleCloseModal();
      await fetchcheckin();
    } catch (err) {
      console.error('Manual checkin error:', err);
    }
  };

  return (
    <div className=" flex justify-center items-center">
      <Table
        isHeaderSticky
        aria-label="Example table with custom cells, pagination and sorting"
        bottomContent={
          <BottomContent
            page={page}
            pages={pages}
            selectedCount={selectedKeys.size}
            totalCount={filteredItems.length}
            onNextPage={onNextPage}
            onPageChange={setPage}
            onPreviousPage={onPreviousPage}
          />
        }
        bottomContentPlacement="outside"
        classNames={{
          wrapper: 'max-h-none overflow-visible',
        }}
        sortDescriptor={sortDescriptor}
        topContent={
          <TopContent
            activities={fetchCanCheckin}
            activityFilter={activityFilter}
            columns={columns}
            filterValue={filterValue}
            setActivityFilter={setActivityFilter}
            setVisibleColumns={setVisibleColumns}
            usersLength={users.length}
            visibleColumns={visibleColumns}
            onClear={onClear}
            onSearchChange={onSearchChange}
            onTypingPress={() => setIsTypingModelOpen(true)}
          />
        }
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
              {(columnKey) => (
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
      </div>
  );
}
