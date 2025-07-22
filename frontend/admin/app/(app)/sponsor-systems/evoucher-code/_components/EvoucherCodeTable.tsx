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
  { name: 'CODE', uid: 'code' },
  { name: 'USED AT', uid: 'usedAt' },
  { name: 'IS USED', uid: 'isUsed' },
  { name: 'USER', uid: 'user' },
];

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
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'code',
    direction: 'ascending',
  });
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  const handleSearch = (value: string) => {
    setFilterValue(value);
    setPage(1);
  };

  const handleClear = () => {
    setFilterValue('');
    setPage(1);
  };

  const filteredItems = useMemo(() => {
    let filteredEvoucherCode = [...(evoucherCodes ?? [])];
    const query = filterValue.toLowerCase();

    if (!!filterValue) {
      filteredEvoucherCode = evoucherCodes.filter((code) => {
        code.code?.toLowerCase().includes(query);
      })
    } 
    return filteredEvoucherCode;
  }, [evoucherCodes, filterValue]);

  const codeItems = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, sortDescriptor]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

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
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
        topContentPlacement="outside"
        topContent={
          <TopContent
            filterValue={filterValue}
            onClear={handleClear}
            onSearchChange={handleSearch}
            setUsedModal={setAddModal}
          />
        }
        bottomContentPlacement="outside"
        bottomContent={
          <BottomContent
            page={page}
            pages={pages}
            setPage={setPage}
          />
        }
      >
        <TableHeader columns={COLUMNS}>
          {(column) => (
            <TableColumn
              key={column.uid}
              align={column.uid === 'actions' ? 'center' : 'start'}
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
          items={[...codeItems]}
        >
          {(code: EvoucherCode) => {
            const uniqueKey = getUniqueKey(code, codeItems.indexOf(code));
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
