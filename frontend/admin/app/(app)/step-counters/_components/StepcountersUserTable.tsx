'use client';

import React from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  SortDescriptor,
} from '@heroui/react';
import { StepsConters } from '@/types/step-conters';

const columns = [
  { name: 'Rank', uid: 'rank', sortable: false },
  { name: 'ID', uid: 'id', sortable: false },
  { name: 'Name', uid: 'name', sortable: true },
  { name: 'School', uid: 'school', sortable: true },
  { name: 'Major', uid: 'major', sortable: false },
  { name: 'Steps', uid: 'steps', sortable: true },
];


type StepContersTableProps = {
  stepCounters: {
    rank:number,
    id: string;
    name: string;
    school: string;
    major: string;
    steps: number;
  }[];
};

export default function UserTable({ stepCounters }: StepContersTableProps) {
  const [page, setPage] = React.useState(1);
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: 'steps',
    direction: 'descending',
  });
  const rowsPerPage = 5;
  const pages = Math.ceil(stepCounters.length / rowsPerPage);

  const sorted = React.useMemo(() => {
    return [...stepCounters].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof typeof a] as number;
      const second = b[sortDescriptor.column as keyof typeof b] as number;
      const cmp = first < second ? -1 : first > second ? 1 : 0;
      return sortDescriptor.direction === 'descending' ? -cmp : cmp;
    });
  }, [stepCounters, sortDescriptor]);

  const paginated = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return sorted.slice(start, start + rowsPerPage);
  }, [page, sorted]);

  const renderCell = (item: StepContersTableProps['stepCounters'][0], columnKey: React.Key) => {
    const value = item[columnKey as keyof typeof item];
    return <p className="text-sm">{value}</p>;
  };

  return (
    <Table
      aria-label="Step Counters Table"
      bottomContent={
        <div className="flex w-full justify-center">
          <Pagination
            isCompact
            showControls
            showShadow
            color="primary"
            page={page}
            total={pages}
            onChange={(page) => setPage(page)}
          />
        </div>
      }
      sortDescriptor={sortDescriptor}
      onSortChange={setSortDescriptor}
    >
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn key={column.uid} allowsSorting={column.sortable}>
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody items={paginated}>
        {(item) => (
          <TableRow key={item.id}>
            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
