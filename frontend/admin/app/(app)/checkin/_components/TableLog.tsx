import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  User as UserComponent,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  Chip,
  Tooltip,
  addToast,
} from '@heroui/react';
import { Plus, User, Calendar } from 'lucide-react';

import { Typing } from './TypingModal';
import { useCheckin } from '@/hooks/useCheckin';
import { useActivities } from '@/hooks/useActivities';
import { useUsers } from '@/hooks/useUsers';

import TopContent from './Tablecomponents/Topcontent';
import BottomContent from './Tablecomponents/BottomContent';
import type { Checkin, Activity } from '@/types/checkin';

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
  const { activities } = useActivities();
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
          activityNameEn: activity?.fullName?.en ?? 'Unknown',
          activityNameTh: activity?.fullName?.th ?? 'ไม่ทราบ',
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
    <div className="container mx-auto flex justify-center items-center px-4 py-6">
      <div className="w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Check-in Records</h1>
          <div className="flex gap-2">
            <Tooltip content="Add manual check-in">
              <Button
                color="primary"
                variant="shadow"
                endContent={<Plus className="w-4 h-4" />}
                onPress={() => setIsManualModalOpen(true)}
                className="font-medium"
              >
                Add Check-in
              </Button>
            </Tooltip>
          </div>
        </div>

        <Table
          isHeaderSticky
          aria-label="Example table with custom cells, pagination and sorting"
          bottomContent={
            <BottomContent
              selectedCount={selectedKeys.size}
              totalCount={filteredItems.length}
              page={page}
              pages={pages}
              onPreviousPage={onPreviousPage}
              onNextPage={onNextPage}
              onPageChange={setPage}
            />
          }
          bottomContentPlacement="outside"
          classNames={{
            wrapper: 'max-h-none overflow-visible',
          }}
          sortDescriptor={sortDescriptor}
          topContent={
            <TopContent
              filterValue={filterValue}
              onClear={() => setFilterValue('')}
              onSearchChange={(value) => setFilterValue(value)}
              activityFilter={activityFilter}
              setActivityFilter={setActivityFilter}
              visibleColumns={visibleColumns}
              setVisibleColumns={setVisibleColumns}
              activities={activities}
              columns={columns}
              usersLength={users.length}
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

        <Modal 
          isOpen={isManualModalOpen} 
          onClose={handleCloseModal}
          placement="center"
          size="lg"
          backdrop="blur"
        >
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">
              <h2 className="text-xl font-bold">Add Manual Check-in</h2>
              <p className="text-sm text-default-500">Select a user and activities to create a new check-in record</p>
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-default-500" />
                    <Select
                      label="Select User"
                      placeholder="Choose a user"
                      selectedKeys={selectedUserId ? [selectedUserId] : []}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        setSelectedUserId(selected);
                      }}
                      variant="bordered"
                      classNames={{
                        trigger: "min-h-unit-12",
                        label: "text-sm font-medium"
                      }}
                    >
                      {filteredUsers.map((user) => (
                        <SelectItem key={user._id} textValue={user.username}>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.username}</span>
                            <span className="text-sm text-default-500">
                              {user.name.first} {user.name.last}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-default-500" />
                    <Select
                      label="Select Activities"
                      placeholder="Choose activities"
                      selectionMode="multiple"
                      selectedKeys={new Set(selectedActivityIds)}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys) as string[];
                        setSelectedActivityIds(selected);
                      }}
                      variant="bordered"
                      classNames={{
                        trigger: "min-h-unit-12",
                        label: "text-sm font-medium"
                      }}
                    >
                      {activities.map((activity) => (
                        <SelectItem key={activity._id} textValue={activity.name.en}>
                          <div className="flex flex-col">
                            <span className="font-medium">{activity.name.en}</span>
                            <span className="text-sm text-default-500">
                              {activity.name.th}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                  {selectedActivityIds.length > 0 && (
                    <p className="text-xs text-default-500">
                      {selectedActivityIds.length} activity{selectedActivityIds.length > 1 ? 'ies' : ''} selected
                    </p>
                  )}
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button 
                color="danger" 
                variant="light" 
                onPress={handleCloseModal}
                className="font-medium"
              >
                Cancel
              </Button>
              <Button 
                color="primary"
                variant="shadow"
                onPress={handleManualCheckin}
                isLoading={loading}
                isDisabled={!selectedUserId || selectedActivityIds.length === 0 || loading}
                className="font-medium"
              >
                Add Check-in
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Typing
          isOpen={isTypingModelOpen}
          onClose={() => {
            fetchcheckin();
            setIsTypingModelOpen(false);
          }}
        />
      </div>
    </div>
  );
}
