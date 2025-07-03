import { useCheckin } from '@/hooks/useCheckin';
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import { UserCheck, Check, X, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

export function CheckinTable() {
  const { checkin } = useCheckin();
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  // const hasSearchFilter = Boolean(filterValue);
  const rowsPerPage = 5;

  const activityColumns = useMemo(() => {
    if (!checkin || checkin.length === 0) return [];

    const allActivityName = new Set<string>();
    checkin.forEach((item) => {
      if (item.activity?.name?.en) {
        allActivityName.add(item.activity?.name?.en);
      }
    });
    return Array.from(allActivityName).sort();
  }, [checkin]);

  const columns = useMemo(
    () => [
      { key: 'name', label: 'Name' },
      { key: 'username', label: 'Username' },
      ...activityColumns.map((activities) => ({
        key: activities,
        label: activities,
      })),
    ],
    [activityColumns],
  );

  const rows = useMemo(() => {
    if (!checkin) return [];

    const grouped: Record<
      string,
      {
        _id: string;
        name: string;
        username: string;
        activities: string[];
      }
    > = {};

    checkin.forEach((item) => {
      const username = item.user?.username || '';
      const name =
        `${item.user?.name?.first || ''} ${item.user?.name?.middle || ''} ${item.user?.name?.last || ''}`.trim();
      const id = item._id;
      const activityName = item.activity?.name?.en;

      if (!grouped[username]) {
        grouped[username] = {
          _id: id,
          name,
          username,
          activities: activityName ? [activityName] : [],
        };
      } else if (activityName) {
        grouped[username].activities.push(activityName);
      }
    });

    return Object.values(grouped).map((item) => {
      const activityMap: Record<string, React.ReactNode> = {};
      activityColumns.forEach((activityName) => {
        activityMap[activityName] = item.activities.includes(activityName) ? (
          <Check className="text-success" />
        ) : (
          <X className="text-" />
        );
      });

      return {
        _id: item._id,
        name: item.name,
        username: item.username,
        ...activityMap,
      } as Record<string, React.ReactNode> & { _id: string };
    });
  }, [checkin, activityColumns]);

  const pages = Math.ceil(rows.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return rows.slice(start, end);
  }, [page, rows]);

  function DataTable() {
    return (
      <Table
        bottomContent={
          <div className=" flex items-center justify-center">
            <Pagination
              isCompact
              showControls
              showShadow
              color="primary"
              page={pages}
              total={pages}
              onChange={(page) => setPage(page)}
            />
          </div>
        }
        classNames={{
          wrapper: 'min-h-[222px]',
        }}
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.key}>{column.label}</TableColumn>
          )}
        </TableHeader>
        <TableBody items={items}>
          {(item) => (
            <TableRow key={item._id}>
              {(columnsKey) => <TableCell>{item[columnsKey] as any}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  }

  // const filteredItems  = useMemo(() => {
  //   let filtered = items;

  //   if (filter)}
  // },[items, filter]);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex px-2 space-x-3">
            <UserCheck className="text-primary" />
            <span> Student Table </span>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <Input
            placeholder="Search by Student Name or ID"
            className=" max-w-96 space-x-2"
            startContent={<Search />}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <DataTable />
        </CardBody>
      </Card>
    </>
  );
}
