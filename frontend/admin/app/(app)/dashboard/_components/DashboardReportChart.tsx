import { useReports } from '@/hooks/useReports';
import { useReportTypes } from '@/hooks/useReportTypes';
import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Pagination,
} from '@heroui/react';
import { useMemo, useState } from 'react';
import {
  Tooltip,
  ResponsiveContainer,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  LabelList,
} from 'recharts';
import {
  ChartColumn,
  ShieldAlert,
  ShieldEllipsis,
  ShieldCheck,
  Bug,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const statusList = ['ALL', 'Pending', 'In-Progress', 'Done'];

export default function ReportChart() {
  const { problems } = useReports();
  const { reporttypes } = useReportTypes();
  const [page, setPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const rowsPerPage = 5;

  const filteredProblems = useMemo(() => {
    return selectedStatus === 'ALL'
      ? problems
      : problems.filter((p) => p.status === selectedStatus);
  }, [problems, selectedStatus]);

  const reporttypeData = reporttypes.map((reporttype) => {
    const filtered = filteredProblems.filter(
      (p) => p.categoryId === reporttype.id,
    );
    return {
      name: reporttype.name.en,
      count: filtered.length,
      pending: filtered.filter((p) => p.status === 'Pending').length,
      inProgress: filtered.filter((p) => p.status === 'In-Progress').length,
      done: filtered.filter((p) => p.status === 'Done').length,
      color: reporttype.color,
    };
  });

  const paginatedData = reporttypeData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  const statusData = [
    {
      name: 'Status',
      value: 'All',
      icon: <Bug />,
      bg: 'bg-blue-100',
      text: 'text-blue-600',
    },
    {
      name: 'Pending',
      value: problems.filter((p) => p.status === 'Pending').length,
      icon: <ShieldAlert />,
      bg: 'bg-gray-100',
      text: 'text-gray-600',
    },
    {
      name: 'In-Progress',
      value: problems.filter((p) => p.status === 'In-Progress').length,
      icon: <ShieldEllipsis />,
      bg: 'bg-yellow-100',
      text: 'text-yellow-600',
    },
    {
      name: 'Done',
      value: problems.filter((p) => p.status === 'Done').length,
      icon: <ShieldCheck />,
      bg: 'bg-green-100',
      text: 'text-green-600',
    },
  ];

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const { name, count, pending, inProgress, done } = payload[0].payload;
      return (
        <Card>
          <CardBody>
            <p className="font-bold">{name}</p>
            <p className="text-warning">Pending {pending}</p>
            <p className="text-primary">In-Progress: {inProgress}</p>
            <p className="text-success">Done: {done}</p>
            <p className="text-default-500">Total Report: {count}</p>
          </CardBody>
        </Card>
      );
    }
  };

  return (
    <div className="flex flex-col lg:flex-row justify-between gap-7">
      <Card className="w-full">
        <CardHeader className="flex px-5 space-x-2 justify-between">
          <div className="flex space-x-2">
            <ChartColumn className="text-primary w-5 h-5" />
            <h3 className="text-lg font-semibold px-2">Problems by Category</h3>
          </div>
          <Autocomplete
            className="max-w-[175px]"
            selectedKey={selectedStatus}
            onSelectionChange={(key) =>
              key && setSelectedStatus(key.toString())
            }
            color="default"
            showScrollIndicators={false}
          >
            {statusList.map((status) => (
              <AutocompleteItem key={status}>{status}</AutocompleteItem>
            ))}
          </Autocomplete>
        </CardHeader>
        <CardBody className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={paginatedData}
              margin={{ left: 0, right: 60, top: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="name"
                stroke="#6B7280"
                tick={{ fontSize: 14, fontWeight: 600 }}
              />
              <YAxis stroke="#6B7280" tick={{ fontSize: 12 }} />
              <Tooltip content={customTooltip} />
              <Bar
                dataKey="count"
                fill="#486CFF"
                radius={[4, 4, 0, 0]}
                barSize={40}
              >
                <LabelList
                  dataKey="count"
                  position="top"
                  style={{ fontSize: 14, fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
        <CardFooter className="flex justify-center items-center pb-5 px-6">
          <Pagination
            showControls
            showShadow
            initialPage={page}
            total={Math.ceil(reporttypeData.length / rowsPerPage)}
            onChange={(newPage) => setPage(newPage)}
          />
        </CardFooter>
      </Card>

      <Card className="min-w-[324px] h-full">
        <CardHeader className="flex px-5 space-x-2">
          <Bug className="text-primary w-5 h-5" />
          <h3 className="text-lg font-semibold px-2"> Problems by Status</h3>
        </CardHeader>
        <CardBody className="flex pb-5">
          <div className="space-y-5 w-full px-4">
            {statusData.map((item, index) => (
              <div key={index} className="flex space-x-5">
                <div
                  className={`p-3.5 rounded-xl ${item.bg} ${item.text} shadow-inner`}
                >
                  {item.icon}
                </div>
                <div className="flex flex-col">
                  <span className="text-medium font-medium text-default-800">
                    {item.name}
                  </span>
                  <span className="text-md font-semibold text-default-500">
                    {item.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
