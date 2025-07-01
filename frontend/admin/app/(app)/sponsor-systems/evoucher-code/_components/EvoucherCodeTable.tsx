import React, { Key, useCallback, useEffect, useMemo, useState } from 'react';
import { EvoucherCode } from '@/types/evoucher-code';
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  SortDescriptor,
} from '@heroui/react';
import TopContent from './TopContent';
import BottomContent from './BottomContent';
import EvoucherCodeCellRenderer from './EvoucherCodeCellRenderer';
import { EvoucherCodeModal } from './EvoucherCodeModal';
import { User } from '@/types/user';
import { Role } from '@/types/role';

const COLUMNS = [
  { name: 'CODE', uid: 'code', sortable: true },
  { name: 'USED AT', uid: 'usedAt', sortable: true },
  { name: 'AVAILABLE', uid: 'isUsed', sortable: true },
  { name: 'USER', uid: 'user', sortable: true },
];

const INITIAL_VISIBLE_COLUMNS = new Set(['code', 'usedAt', 'isUsed', 'user']);
const ROWS_PER_PAGE = 5;

type EvoucherCodeTableProps = {
  evoucherCodes: EvoucherCode[];
  setAddModal: (value: boolean) => void;
  handleAddEvoucherCode: (evoucherId: string, userId?: string, roleId?: string) => void;
  addModal: boolean;
  roles: Role[];
  users: User[];
};

export default function EvoucherCodeTable({
  evoucherCodes,
  setAddModal,
  handleAddEvoucherCode,
  addModal,
  roles,
  users,
}: EvoucherCodeTableProps) {
  const [filterValue, setFilterValue] = useState('');
  const [visibleColumns, setVisibleColumns] = useState(INITIAL_VISIBLE_COLUMNS);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'code',
    direction: 'ascending',
  });
  const [page, setPage] = useState(1);

  const filteredItems = useMemo(() => {
    return evoucherCodes.filter((item) => {
      if (!filterValue) return true;
      return item.code?.toLowerCase().includes(filterValue.toLowerCase());
    });
  }, [filterValue, evoucherCodes]);

  const sortedItems = useMemo(() => {
    const sorted = [...filteredItems];
    const { column, direction } = sortDescriptor;
    sorted.sort((a: EvoucherCode, b: EvoucherCode) => {
      const valA = a[column as keyof EvoucherCode];
      const valB = b[column as keyof EvoucherCode];
      if (valA === undefined || valB === undefined) return 0;
      const comparison = String(valA).localeCompare(String(valB));
      return direction === 'ascending' ? comparison : -comparison;
    });
    return sorted;
  }, [filteredItems, sortDescriptor]);

  const pages = Math.ceil(sortedItems.length / ROWS_PER_PAGE);
  const pagedItems = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return sortedItems.slice(start, start + ROWS_PER_PAGE);
  }, [page, sortedItems]);

  const handleSearch = (value: string) => {
    setFilterValue(value);
    setPage(1);
  };

  const handleClear = () => {
    setFilterValue('');
    setPage(1);
  };

  const headerColumns = useMemo(
    () => COLUMNS.filter((column) => visibleColumns.has(column.uid)),
    [visibleColumns],
  );

  const renderCell = useCallback(
    (evoucherCodes: EvoucherCode, columnKey: Key) => {
      return (
        <EvoucherCodeCellRenderer
          evoucherCodes={evoucherCodes}
          columnKey={columnKey}
        />
      );
    },
    [evoucherCodes],
  );

  const getUniqueKey = (item: EvoucherCode, index: number) =>
    `${item._id}-${index}`;

  return (
    <div>
      <Table
        isHeaderSticky
        aria-label="Evoucher Code Table"
        topContent={
          <TopContent
            filterValue={filterValue}
            onClear={handleClear}
            onSearchChange={handleSearch}
            setUsedModal={setAddModal}
          />
        }
        bottomContent={
          <BottomContent page={page} pages={pages} setPage={setPage} />
        }
        bottomContentPlacement="outside"
        topContentPlacement="outside"
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
      >
        <TableHeader columns={headerColumns}>
          {(column) => (
            <TableColumn
              key={column.uid}
              align={column.uid === 'actions' ? 'center' : 'start'}
              allowsSorting={column.sortable}
              className="w-1/4"
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody
          emptyContent={
            <div className="flex flex-col items-center justify-center py-8">
              <span className="text-default-400">No evoucher codes found</span>
            </div>
          }
          items={pagedItems}
        >
          {(code: EvoucherCode) => {
            const uniqueKey = getUniqueKey(code, pagedItems.indexOf(code));
            return (
              <TableRow
                key={uniqueKey}
                className="hover:bg-default-50 transition-colors"
              >
                {(columnKey) => (
                  <TableCell className="py-4">
                    {renderCell(code, columnKey)}
                  </TableCell>
                )}
              </TableRow>
            );
          }}
        </TableBody>
      </Table>

      <EvoucherCodeModal
        isOpen={addModal}
        onClose={() => setAddModal(false)}
        onSuccess={handleAddEvoucherCode}
        evoucherCodes={evoucherCodes}
        roles={roles}
        users={users}
      />
    </div>
  );
}
