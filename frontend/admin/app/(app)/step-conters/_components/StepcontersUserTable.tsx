import { StepsConters } from '@/types/step-conters';
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

const students = [
  {
    key: '1',
    name: 'Tony Reichert',
    major: 'Software Engineer',
    school: 'School of IT',
    time: '13-4-2002',
    stepsCounts: 1234,
  },
  {
    key: '2',
    name: 'Anna Smith',
    major: 'Data Science',
    school: 'School of Computing',
    time: '22-6-2001',
    stepsCounts: 8765,
  },
  {
    key: '3',
    name: 'John Doe',
    major: 'Cyber Security',
    school: 'School of Engineering',
    time: '5-1-2003',
    stepsCounts: 4503,
  },
  {
    key: '4',
    name: 'Emily Davis',
    major: 'Game Development',
    school: 'School of IT',
    time: '14-3-2002',
    stepsCounts: 1093,
  },
  {
    key: '5',
    name: 'Michael Brown',
    major: 'AI & Robotics',
    school: 'School of Technology',
    time: '9-9-2000',
    stepsCounts: 6321,
  },
  {
    key: '6',
    name: 'Sophia Johnson',
    major: 'Software Engineer',
    school: 'School of Engineering',
    time: '18-11-2002',
    stepsCounts: 7840,
  },
  {
    key: '7',
    name: 'James Wilson',
    major: 'Computer Science',
    school: 'School of IT',
    time: '12-7-2001',
    stepsCounts: 2999,
  },
  {
    key: '8',
    name: 'Olivia Martinez',
    major: 'Cyber Security',
    school: 'School of Technology',
    time: '3-2-2003',
    stepsCounts: 5567,
  },
  {
    key: '9',
    name: 'William Anderson',
    major: 'AI & Robotics',
    school: 'School of Computing',
    time: '25-12-2001',
    stepsCounts: 3912,
  },
  {
    key: '10',
    name: 'Isabella Thomas',
    major: 'Data Science',
    school: 'School of Engineering',
    time: '7-10-2002',
    stepsCounts: 6982,
  },
  {
    key: '11',
    name: 'Ethan Moore',
    major: 'Game Development',
    school: 'School of IT',
    time: '1-5-2000',
    stepsCounts: 4120,
  },
  {
    key: '12',
    name: 'Mia Taylor',
    major: 'Software Engineer',
    school: 'School of Computing',
    time: '19-6-2003',
    stepsCounts: 3211,
  },
  {
    key: '13',
    name: 'Alexander Lee',
    major: 'Computer Science',
    school: 'School of Technology',
    time: '11-3-2001',
    stepsCounts: 5674,
  },
  {
    key: '14',
    name: 'Charlotte White',
    major: 'AI & Robotics',
    school: 'School of IT',
    time: '30-8-2002',
    stepsCounts: 2468,
  },
  {
    key: '15',
    name: 'Daniel Harris',
    major: 'Cyber Security',
    school: 'School of Computing',
    time: '6-4-2003',
    stepsCounts: 7345,
  },
  {
    key: '16',
    name: 'Amelia Clark',
    major: 'Game Development',
    school: 'School of Engineering',
    time: '17-12-2001',
    stepsCounts: 1580,
  },
  {
    key: '17',
    name: 'Henry Lewis',
    major: 'Computer Science',
    school: 'School of Technology',
    time: '21-2-2002',
    stepsCounts: 4801,
  },
  {
    key: '18',
    name: 'Grace Walker',
    major: 'Data Science',
    school: 'School of IT',
    time: '4-6-2000',
    stepsCounts: 6872,
  },
  {
    key: '19',
    name: 'Liam Hall',
    major: 'Software Engineer',
    school: 'School of Engineering',
    time: '28-10-2002',
    stepsCounts: 3920,
  },
  {
    key: '20',
    name: 'Zoe Young',
    major: 'AI & Robotics',
    school: 'School of Computing',
    time: '13-9-2001',
    stepsCounts: 5109,
  },
];

type student = (typeof students)[0];

const columns = [
  { name: 'ID', uid: 'key', sortable: true },
  { name: 'Name', uid: 'name', sortable: true },
  { name: 'School', uid: 'school', sortable: true },
  { name: 'StepsCounts', uid: 'stepsCounts', sortable: true },
  { name: 'Time', uid: 'time', sortable: true },
];

type StepContersTableProps = {
  stepCounters: StepsConters[];
};

export default function UserTable({ stepCounters }: StepContersTableProps) {
  const [page, setPage] = React.useState(1);
  const rowsPerPage = 5;
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: 'stepsCounts',
    direction: 'descending',
  });
  const pages = Math.ceil(students.length / rowsPerPage);

  const sortedStudents = React.useMemo(() => {
    return [...students].sort((a: student, b: student) => {
      const first = a[sortDescriptor.column as keyof student] as number;
      const second = b[sortDescriptor.column as keyof student] as number;
      const cmp = first < second ? -1 : first > second ? 1 : 0;
      return sortDescriptor.direction === 'descending' ? -cmp : cmp;
    });
  }, [sortDescriptor]);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return sortedStudents.slice(start, end);
  }, [page, sortedStudents]);

  const renderCell = React.useCallback(
    (user: student, columnKey: React.Key) => {
      const cellValue = user[columnKey as keyof student];

      switch (columnKey) {
        case 'name':
          return (
            <div className="flex flex-col">
              <p className="atext-bold text-small capitalize">{cellValue}</p>
              <p className="text-bold text-tiny capitalize text-default-500">
                เลขรหัส นักศึกษา
              </p>
            </div>
          );
        case 'school':
          return (
            <div className="flex flex-col">
              <p className="atext-bold text-small capitalize">{cellValue}</p>
              <p className="text-bold text-tiny capitalize text-default-500">
                {user.major}
              </p>
            </div>
          );
        case 'stepsCounts':
          return <p className="text-bold text-small capitalize">{cellValue}</p>;
        case 'time':
          return <p className="text-bold text-small capitalize">{cellValue}</p>;
        default:
          return cellValue;
      }
    },
    [],
  );

  return (
    <Table
      aria-label="Example table with client side pagination"
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
          <TableColumn
            key={column.uid}
            align={column.uid === 'actions' ? 'center' : 'start'}
            allowsSorting={column.sortable}
          >
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody items={items}>
        {(item) => (
          <TableRow key={item.name}>
            {(columnKey) => (
              <TableCell>{renderCell(item, columnKey)}</TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
