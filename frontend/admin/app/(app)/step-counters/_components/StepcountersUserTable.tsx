import { StepsCounters } from '@/types/step-counters';
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

type StepContersTableProps = {
  stepCounters: StepsCounters[];
};

type StepCountersItem = StepsCounters & { key: string };

const columns = [
  { name: 'Rank', uid: 'rank', sortable: true },
  { name: 'Name', uid: 'name', sortable: true },
  { name: 'School', uid: 'school', sortable: true },
  { name: 'StepsCounts', uid: 'stepsCounts', sortable: true },
  { name: 'Time', uid: 'time', sortable: true },
];

export default function UserTable({ stepCounters }: StepContersTableProps) {
  const [page, setPage] = React.useState(1);
  const rowsPerPage = 5;
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: 'stepsCounts',
    direction: 'descending',
  });


  const dataWithKeys = React.useMemo<StepCountersItem[]>(() => {
    return stepCounters.map((item, index) => ({
      ...item,
      key: String(index + 1),
    }));
  }, [stepCounters]);

  const pages = Math.ceil(dataWithKeys.length / rowsPerPage);

  const sortedData = React.useMemo(() => {
    return [...dataWithKeys].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof StepCountersItem];
      const second = b[sortDescriptor.column as keyof StepCountersItem];
      const isNumber = typeof first === 'number' && typeof second === 'number';

      const cmp = isNumber
        ? (first as number) - (second as number)
        : String(first).localeCompare(String(second));

      return sortDescriptor.direction === 'descending' ? -cmp : cmp;
    });
  }, [sortDescriptor, dataWithKeys]);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [page, sortedData]);

  const renderCell = React.useCallback(
    (user: StepCountersItem, columnKey: React.Key) => {
      const cellValue = user[columnKey as keyof StepCountersItem];

      switch (columnKey) {
        case 'name':
          return (
            <div className="flex flex-col">
              <p className="font-bold text-sm capitalize">{cellValue}</p>
              <p className="text-xs text-gray-500">student id</p>
            </div>
          );
        case 'school':
          return (
            <div className="flex flex-col">
              <p className="font-bold text-sm capitalize">{cellValue}</p>
              <p className="text-xs text-gray-500">{user.major}</p>
            </div>
          );
        case 'stepsCounts':
        case 'time':
          return <p className="text-sm">{cellValue}</p>;
        case 'rank':
          return <p className="text-sm">{user.rank ?? user.key}</p>;
        default:
          return <p className="text-sm">{String(cellValue)}</p>;
      }
    },
    [],
  );

  return (
    <Table
      aria-label="Step Counter Table"
      bottomContent={
        <div className="flex w-full justify-center">
          <Pagination
            isCompact
            showControls
            showShadow
            color="primary"
            page={page}
            total={pages}
            onChange={(p) => setPage(p)}
          />
        </div>
      }
      classNames={{
        wrapper: 'min-h-[222px]',
      }}
      sortDescriptor={sortDescriptor}
      onSortChange={setSortDescriptor}
    >
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn
            key={column.uid}
            allowsSorting={column.sortable}
          >
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody items={items}>
        {(item) => (
          <TableRow key={item.key}>
            {(columnKey) => (
              <TableCell>{renderCell(item, columnKey)}</TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
