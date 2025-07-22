"use client";

import type { Problem, ReportTypes } from "@/types/report";

import { Card, CardBody, CardFooter } from "@heroui/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Label } from 'recharts';
import { TrendingUp } from "lucide-react";

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
];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                <p className="font-medium">{label}</p>
                <p className="text-sm text-gray-600">
                    {payload[0].dataKey === 'count' ? 'Count' : 'Value'}: {payload[0].value}
                </p>
            </div>
        );
    }

    return null;
};

export function ProblemCharts({ problems, reporttypes }: ProblemChartsProps) {
    const reporttypeData: ChartData[] = reporttypes.map(reporttype => ({
        name: reporttype.name.en,
        count: problems.filter(p => p.categoryId === reporttype.id).length,
        color: reporttype.color
    }));


    const statusData: ChartData[] = [
        { name: 'Pending', value: problems.filter(p => p.status === 'pending').length },
        { name: 'In-Progress', value: problems.filter(p => p.status === 'in-progress').length },
        { name: 'Done', value: problems.filter(p => p.status === 'done').length }
    ];

    const totalProblems = problems.length;
    const doneProblems = problems.filter(p => p.status === 'done').length;
    const resolutionRate = totalProblems > 0 ? (doneProblems / totalProblems * 100).toFixed(1) : 0;

    return (
        <Card className="mb-6">
            <CardBody>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Problems by Category</h3>
                        <div className="h-[250px]">
                            <ResponsiveContainer height="100%" width="100%">
                                <BarChart data={reporttypeData}>
                                    <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#6B7280"
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis
                                        stroke="#6B7280"
                                        tick={{ fontSize: 12 }}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar
                                        dataKey="count"
                                        fill={COLORS.primary}
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Problems by Status</h3>
                        <div className="h-[250px]">
                            <ResponsiveContainer height="100%" width="100%">
                                <PieChart>
                                    <Pie
                                        cx="50%"
                                        cy="50%"
                                        data={statusData}
                                        dataKey="value"
                                        fill={COLORS.primary}
                                        innerRadius={60}
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
                                        <Label
                                            content={({ viewBox }) => {
                                                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                    return (
                                                        <text
                                                            dominantBaseline="middle"
                                                            textAnchor="middle"
                                                            x={viewBox.cx}
                                                            y={viewBox.cy}
                                                        >
                                                            <tspan
                                                                className="fill-foreground text-2xl font-bold"
                                                                x={viewBox.cx}
                                                                y={viewBox.cy}
                                                            >
                                                                {resolutionRate}%
                                                            </tspan>
                                                            <tspan
                                                                className="fill-muted-foreground text-sm"
                                                                x={viewBox.cx}
                                                                y={(viewBox.cy || 0) + 24}
                                                            >
                                                                Resolution Rate
                                                            </tspan>
                                                        </text>
                                                    );
                                                }
                                            }}
                                        />
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </CardBody>
            <CardFooter className="flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 font-medium leading-none">
                    {totalProblems > 0 && (
                        <>
                            Active problems: {totalProblems} <TrendingUp className="h-4 w-4" />
                        </>
                    )}
                </div>
                <div className="leading-none text-muted-foreground">
                    Showing real-time problem statistics
                </div>
            </CardFooter>
        </Card>
    );
} 