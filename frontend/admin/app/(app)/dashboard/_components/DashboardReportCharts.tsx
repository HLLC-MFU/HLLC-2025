import type { Problem, ReportTypes } from "@/types/report";

import { Card, CardBody } from "@heroui/react";
import { Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ProblemChartsProps {
    problems: Problem[];
    reporttypes: ReportTypes[];
}

interface ChartData {
    name: string;
    value?: number;
    count?: number;
    color?: string;
}

interface PieLabelProps {
    name: string;
    percent: number;
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
            <div className="bg-white p-3 rounded-lg shadow-md border border-gray-200">
                <p className="font-medium">{label}</p>
                <p className="text-sm text-gray-600">
                    {payload[0].dataKey === 'count' ? 'Count' : 'Value'}: {payload[0].value}
                </p>
            </div>
        );
    }

    return null;
};

export function ReportCharts({ problems, reporttypes }: ProblemChartsProps) {
    const reporttypeData: ChartData[] = reporttypes.map(reporttype => ({
        name: reporttype.name.en,
        count: problems.filter(p => p.categoryId === reporttype.id).length,
        color: reporttype.color
    }));


    const statusData: ChartData[] = [
        { name: 'Pending', value: problems.filter(p => p.status === 'Pending').length },
        { name: 'In-Progress', value: problems.filter(p => p.status === 'In-Progress').length },
        { name: 'Done', value: problems.filter(p => p.status === 'Done').length }
    ];

    const totalProblems = problems.length;
    const doneProblems = problems.filter(p => p.status === 'Done').length;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardBody>
                    <h3 className="text-lg font-semibold ">Problems by Category</h3>
                    <div className=" h-[300px]">
                        <ResponsiveContainer height="100%" width="100%">
                            <PieChart>
                                <Pie
                                    cx="50%"
                                    cy="50%"
                                    data={reporttypeData}
                                    dataKey="count"
                                    innerRadius={50}
                                    label={({ name, percent }) => ` ${(percent * 100).toFixed(0)}%`}
                                    labelLine={false}
                                    nameKey="name"
                                    outerRadius={80}
                                >
                                    {reporttypeData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                                            stroke="#fff"
                                        />
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
                    <h3 className="text-lg font-semibold ">Problems by Status</h3>
                    <div className=" h-[300px]">
                        <ResponsiveContainer height="100%" width="100%">
                            <PieChart>
                                <Pie
                                    cx="50%"
                                    cy="50%"
                                    data={statusData}
                                    dataKey="value"
                                    fill={COLORS.primary}
                                    innerRadius={50}
                                    label={({ name, percent }) => ` ${(percent * 100).toFixed(0)}%`}
                                    labelLine={false}
                                    outerRadius={80}
                                    strokeWidth={2}
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                                            stroke="#fff"
                                        />
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