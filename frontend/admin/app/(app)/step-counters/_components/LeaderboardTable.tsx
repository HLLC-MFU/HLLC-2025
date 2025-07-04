'use client';

import { StepsCounters } from '@/types/step-counters';
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
import React from 'react';

type Props = {
  stepCounters?: StepsCounters[]; // ← ใส่เป็น optional
};

// mock data fallback
const mockStepCounters: StepsCounters[] = [
  { key: '1', name: 'Tony Reichert', major: 'Software Engineer', school: 'School of IT', time: '13-4-2002', stepsCounts: 9000, rank: 1 },
  { key: '2', name: 'Anna Smith', major: 'Data Science', school: 'School of Computing', time: '22-6-2001', stepsCounts: 8900, rank: 2 },
  { key: '3', name: 'John Doe', major: 'Cyber Security', school: 'School of Engineering', time: '5-1-2003', stepsCounts: 8800, rank: 3 },
  { key: '4', name: 'Emily Davis', major: 'Game Development', school: 'School of IT', time: '14-3-2002', stepsCounts: 8700, rank: 4 },
  { key: '5', name: 'Michael Brown', major: 'AI & Robotics', school: 'School of Technology', time: '9-9-2000', stepsCounts: 8600, rank: 5 },
  { key: '6', name: 'Sophia Johnson', major: 'Software Engineer', school: 'School of Engineering', time: '18-11-2002', stepsCounts: 8500, rank: 6 },
  { key: '7', name: 'James Wilson', major: 'Computer Science', school: 'School of IT', time: '12-7-2001', stepsCounts: 8400, rank: 7 },
  { key: '8', name: 'Olivia Martinez', major: 'Cyber Security', school: 'School of Technology', time: '3-2-2003', stepsCounts: 8300, rank: 8 },
  { key: '9', name: 'William Anderson', major: 'AI & Robotics', school: 'School of Computing', time: '25-12-2001', stepsCounts: 8200, rank: 9 },
  { key: '10', name: 'Isabella Thomas', major: 'Data Science', school: 'School of Engineering', time: '7-10-2002', stepsCounts: 8100, rank: 10 },
  { key: '11', name: 'Ethan Moore', major: 'Game Development', school: 'School of IT', time: '1-5-2000', stepsCounts: 8000, rank: 11 },
  { key: '12', name: 'Mia Taylor', major: 'Software Engineer', school: 'School of Computing', time: '19-6-2003', stepsCounts: 7900, rank: 12 },
  { key: '13', name: 'Alexander Lee', major: 'Computer Science', school: 'School of Technology', time: '11-3-2001', stepsCounts: 7800, rank: 13 },
  { key: '14', name: 'Charlotte White', major: 'AI & Robotics', school: 'School of IT', time: '30-8-2002', stepsCounts: 7700, rank: 14 },
  { key: '15', name: 'Daniel Harris', major: 'Cyber Security', school: 'School of Computing', time: '6-4-2003', stepsCounts: 7600, rank: 15 },
  { key: '16', name: 'Amelia Clark', major: 'Game Development', school: 'School of Engineering', time: '17-12-2001', stepsCounts: 7500, rank: 16 },
  { key: '17', name: 'Henry Lewis', major: 'Computer Science', school: 'School of Technology', time: '21-2-2002', stepsCounts: 7400, rank: 17 },
  { key: '18', name: 'Grace Walker', major: 'Data Science', school: 'School of IT', time: '4-6-2000', stepsCounts: 7300, rank: 18 },
  { key: '19', name: 'Liam Hall', major: 'Software Engineer', school: 'School of Engineering', time: '28-10-2002', stepsCounts: 7200, rank: 19 },
  { key: '20', name: 'Zoe Young', major: 'AI & Robotics', school: 'School of Computing', time: '13-9-2001', stepsCounts: 7100, rank: 20 },
];

const columns = [
  { name: 'ID', uid: 'key', sortable: true },
  { name: 'Name', uid: 'name', sortable: true },
  { name: 'School', uid: 'school', sortable: true },
  { name: 'Steps', uid: 'stepsCounts', sortable: true },
  { name: 'Time', uid: 'time', sortable: true },
];

export default function LeaderboardTable({ stepCounters }: Props) {
  const data = stepCounters && stepCounters.length > 0 ? stepCounters : mockStepCounters;

  const [page, setPage] = React.useState(1);
  const rowsPerPage = 5;
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: 'stepsCounts',
    direction: 'descending',
  });

  const pages = Math.ceil(data.length / rowsPerPage);

  const sorted = React.useMemo(() => {
    return [...data].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof StepsCounters] as number;
      const second = b[sortDescriptor.column as keyof StepsCounters] as number;
      const cmp = first < second ? -1 : first > second ? 1 : 0;
      return sortDescriptor.direction === 'descending' ? -cmp : cmp;
    });
  }, [data, sortDescriptor]);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return sorted.slice(start, start + rowsPerPage);
  }, [page, sorted]);

  const renderCell = (user: StepsCounters, columnKey: React.Key) => {
    const cellValue = user[columnKey as keyof StepsCounters];
    switch (columnKey) {
      case 'name':
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">{cellValue}</p>
            <p className="text-tiny text-default-500">ลำดับ: {user.rank}</p>
          </div>
        );
      case 'school':
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">{cellValue}</p>
            <p className="text-tiny text-default-500">{user.major}</p>
          </div>
        );
      default:
        return <p className="text-bold text-small capitalize">{cellValue}</p>;
    }
  };

  return (
    <Table
      aria-label="Leaderboard Table"
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
      <TableBody items={items}>
        {(item) => (
          <TableRow key={item.key}>
            {(colKey) => <TableCell>{renderCell(item, colKey)}</TableCell>}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
