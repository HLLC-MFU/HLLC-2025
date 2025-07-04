import { useReports } from '@/hooks/useReports';
import { useReportTypes } from '@/hooks/useReportTypes';
import { Card, CardBody, CardFooter, CardHeader, Pagination } from '@heroui/react';
import { useState } from 'react';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartPie , ChartColumn } from 'lucide-react';

interface ChartData {
  name: string;
  value?: number;
  count?: number;
  color?: string;
}

export default function ReportChart() {
  const { problems } = useReports();
  const { reporttypes } = useReportTypes();
  const [ page, setPage] = useState(1);
  const rowsPerPage = 5;

  const reporttypeData: ChartData[] = reporttypes.map((reporttype) => ({
    name: reporttype.name.en,
    count: problems.filter((p) => p.categoryId === reporttype.id).length,
    pending: problems.filter((p) => p.categoryId === reporttype.id && p.status === 'Pending').length,
    inProgress: problems.filter((p) => p.categoryId === reporttype.id && p.status === 'In-Progress').length,
    done: problems.filter((p) => p.categoryId === reporttype.id && p.status === 'Done').length,
    color: reporttype.color,
  }));

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const { name, count , pending , inProgress , done} = payload[0].payload;
      return (
        <div className="bg-white p-2 rounded shadow">
          <p className="font-bold">{name}</p>
          <p className="text-warning">Pending {pending} </p>
          <p className="text-primary">In-Progress: {inProgress} </p>
          <p className='text-success'>Done: {done} </p>
          <p className="text-default-500">Total Report: {count} </p>
        </div>
      );
    }
  };

  const statusData: ChartData[] = [
    {
      name: 'Pending',
      value: problems.filter((p) => p.status === 'Pending').length,
      color: '#ECE500',
    },
    {
      name: 'In-Progress',
      value: problems.filter((p) => p.status === 'In-Progress').length,
      color: '#47C0FF',
    },
    {
      name: 'Done',
      value: problems.filter((p) => p.status === 'Done').length,
      color: '#28EC4F',
    },
  ];

  const paginatedData = reporttypeData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  return (
    <div className="flex flex-col lg:flex-row justify-between gap-7">
      <Card className=" w-full">
        <CardHeader className='flex px-5 space-x-2 '>
          <ChartColumn className='text-primary w-5 h-5'/>
          <h3 className="text-lg font-semibold ">Problems by Category</h3>
        </CardHeader>
        <CardBody className=" h-[300px]">
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
              <Tooltip content={ customTooltip } />
              <Bar
                dataKey="count"
                fill='#486CFF'
                radius={[4, 4, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
        <CardFooter className="flex justify-center items-center">
          <Pagination
            initialPage={page}
            total={Math.ceil(reporttypeData.length / rowsPerPage)}
            onChange={(newPage) => setPage(newPage)}
          />
        </CardFooter>
      </Card>
      <Card className=" min-w-[324px]">
        <CardHeader className='flex px-5 space-x-2 '>
          <ChartPie className="text-primary w-5 h-5" />
          <h3 className="text-lg font-semibold px-2"> Problems by Status</h3>
        </CardHeader>
        <CardBody className=" flex justify-center items-center">
          <PieChart width={300} height={200}>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              innerRadius={62}
              outerRadius={90}
              dataKey="value"
              strokeWidth={3}
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </CardBody>
        <CardFooter>
          <div className=" space-y-3 text-sm w-full px-4 mb-3 ">
            {statusData.map((item) => (
              <div
                key={item.name}
                className="flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-md"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className=" text-sm font-medium">{item.name}</span>
                </div>
                <span className=" text-sm font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
