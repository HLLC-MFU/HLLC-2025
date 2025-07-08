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

import { StepCounter } from '@/types/step-counters';
import { useMajors } from '@/hooks/useMajor';

export type StepContersTableProps = {
  stepCounters: StepCounter[];
};

type StepsCountersList = {
  key: string;
  rank: number | null;
  id: string;
  name: string;
  major: string;
  school: string;
  steps: number;
  time: string;
};

export default function StepCountersTable({ stepCounters }: StepContersTableProps) {
  const { majors } = useMajors();

  const [page, setPage] = React.useState(1);
  const rowsPerPage = 5;
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: 'rank',
    direction: 'ascending',
  });

  const normalizedData: StepsCountersList[] = React.useMemo(() => {
    return stepCounters.map((item, index) => {
      const majorId =
        typeof item.user?.metadata?.major === 'string'
          ? item.user.metadata.major
          : item.user?.metadata?.major?._id;

      const matchedMajor = majors.find((m) => m._id === majorId);

      const majorName =
        matchedMajor?.name?.en ?? matchedMajor?.name?.th ?? 'Unknown Major';
      const schoolName =
        typeof matchedMajor?.school === 'object'
          ? matchedMajor.school.name?.en ??
            matchedMajor.school.name?.th ??
            'Unknown School'
          : 'Unknown School';

      return {
        key: String(index + 1),
        rank: item.rank ?? null,
        id: item.user?.username ?? '-',
        name: `${item.user?.name?.first ?? ''} ${item.user?.name?.middle ?? ''} ${item.user?.name?.last ?? ''}`.trim(),
        major: majorName,
        school: schoolName,
        steps: item.totalStep ?? 0,
        time: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '',
      };
    });
  }, [stepCounters, majors]);

  

  const pages = Math.ceil(normalizedData.length / rowsPerPage);

  const sortedData = React.useMemo(() => {
    return [...normalizedData].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof StepsCountersList];
      const second = b[sortDescriptor.column as keyof StepsCountersList];
      const isNumber = typeof first === 'number' && typeof second === 'number';

      const cmp = isNumber
        ? (first as number) - (second as number)
        : String(first).localeCompare(String(second));

      return sortDescriptor.direction === 'descending' ? -cmp : cmp;
    });
  }, [sortDescriptor, normalizedData]);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [page, sortedData]);

  const renderCell = React.useCallback(
    (user: StepsCountersList, columnKey: React.Key) => {
      switch (columnKey) {
        case 'rank':
          return <p className="text-sm">{user.rank ?? user.key}</p>;
        case 'id':
          return <p className="text-sm">{user.id}</p>;
        case 'name':
          return <p className="text-sm font-semibold">{user.name}</p>;
        case 'school':
          return <p className="text-sm">{user.school}</p>;
        case 'major':
          return <p className="text-sm">{user.major}</p>;
        case 'steps':
          return <p className="text-sm">{user.steps}</p>;
        case 'time':
          return <p className="text-sm">{user.time}</p>;
        default:
          return <p className="text-sm">-</p>;
      }
    },
    [],
  );

  const columns = [
    { name: 'Rank', uid: 'rank', sortable: true },
    { name: 'ID', uid: 'id', sortable: true },
    { name: 'Name', uid: 'name', sortable: true },
    { name: 'School', uid: 'school', sortable: true },
    { name: 'Major', uid: 'major', sortable: true },
    { name: 'Steps', uid: 'steps', sortable: true },
    { name: 'Time', uid: 'time', sortable: true },
  ];

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
          <TableColumn key={column.uid} allowsSorting={column.sortable}>
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody items={items} emptyContent="No step data to display.">
        {(item) => (
          <TableRow key={item.key}>
            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
