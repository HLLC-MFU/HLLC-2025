import { Key, useCallback, useMemo, useState } from 'react';
import { SortDescriptor } from '@react-types/shared';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { StepCounter } from '@/types/step-counters';
import { Major } from '@/types/major';
import { School } from '@/types/school';

type StepContersTableProps = {
  stepCounters: StepCounter[];
  isOverall?: boolean;
};

export default function StepContersTable({
  stepCounters,
  isOverall = true,
}: StepContersTableProps) {
  const columns = [
    { name: 'RANK', uid: isOverall ? 'computedRank' : 'rank', sortable: true },
    { name: 'NAME', uid: 'name' },
    { name: 'SCHOOL', uid: 'school' },
    { name: 'MAJOR', uid: 'major' },
    { name: 'STEPS', uid: 'totalStep', sortable: true },
  ];

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'rank',
    direction: 'ascending',
  });

  const sortedStepCounters = useMemo(() => {
    return [...stepCounters].sort((curr, next) => {
      const currentSorted = curr[sortDescriptor.column as keyof StepCounter] as number;
      const nextSorted = next[sortDescriptor.column as keyof StepCounter] as number;
      const compare = currentSorted < nextSorted ? -1 : currentSorted > nextSorted ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -compare : compare;
    })
  }, [stepCounters, sortDescriptor])

  const renderCell = useCallback((step: StepCounter, columnKey: Key) => {
    switch (columnKey) {
      case 'computedRank':
        return <p>{step.computedRank}</p>
      case 'rank':
        return <p>{step.rank}</p>
      case 'name':
        const userName = step.user.name;
        return (
          <p>{userName.first} {userName.middle ?? ''} {userName.last ?? ''}</p>
        )
      case 'school':
        const major = step.user.metadata?.major as Major;
        return <p>{(major?.school as School)?.name.en ?? '-'}</p>
      case 'major':
        return <p>{(step.user.metadata?.major as Major)?.name.en ?? '-'}</p>
      case 'totalStep':
        return <p>{step.totalStep}</p>
      default:
        return <p>-</p>;
    }
  }, []);

  return (
    <Table
      aria-label="Step Counter Table"
      sortDescriptor={sortDescriptor}
      onSortChange={setSortDescriptor}
      className="mb-2"
    >
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn key={column.uid} allowsSorting={column.sortable}>
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody emptyContent="No step data to display." items={sortedStepCounters}>
        {(step: StepCounter) => (
          <TableRow key={isOverall ? step.computedRank : step.rank}>
            {(columnKey) => <TableCell>{renderCell(step, columnKey)}</TableCell>}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}