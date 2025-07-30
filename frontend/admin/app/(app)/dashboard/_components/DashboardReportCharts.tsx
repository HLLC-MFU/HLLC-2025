'use client';

import type { Report, ReportTypes } from "@/types/report";
import { Card, CardBody } from "@heroui/react";
import { Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ReportChartsProps {
  reports: Report[];
  reporttypes: ReportTypes[];
}

interface ChartData {
  name: string;
  value?: number;
  count?: number;
  color?: string;
}

const COLORS = {
  primary: '#006FEE',
  secondary: '#9353D3',
  success: '#17C964',
  warning: '#F5A524',
  danger: '#F31260',
  default: '#889096'
};

const CHART_COLORS = [
  COLORS.danger,
  COLORS.warning,
  COLORS.success,
  COLORS.primary,
  COLORS.secondary,
  '#FF6B6B',
  '#4ECDC4',
  '#C7F464',
  '#FFA07A',
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <p className="font-medium text-black dark:text-white">{label}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {payload[0].dataKey === 'count' ? 'Count' : 'Value'}: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export function ReportCharts({ reports, reporttypes }: ReportChartsProps) {
  const reporttypeData: ChartData[] = reporttypes.map(reporttype => ({
    name: reporttype.name.en,
    count: reports.filter(p => p.category._id === reporttype._id).length,
    color: reporttype.color
  }));

  const statusData: ChartData[] = [
    { name: 'Pending', value: reports.filter(p => p.status === 'pending').length },
    { name: 'In-Progress', value: reports.filter(p => p.status === 'in-progress').length },
    { name: 'Done', value: reports.filter(p => p.status === 'done').length }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardBody>
          <h3 className="text-lg font-semibold">Reports by Category</h3>
          <div className="h-[300px]">
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie
                  cx="50%"
                  cy="50%"
                  data={reporttypeData}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {reporttypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="#fff" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="text-lg font-semibold">Reports by Status</h3>
          <div className="h-[300px]">
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie
                  cx="50%"
                  cy="50%"
                  data={statusData}
                  dataKey="value"
                  innerRadius={50}
                  outerRadius={80}
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="#fff" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
