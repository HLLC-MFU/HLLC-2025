"use client";

import { Card, CardBody, CardHeader, CardFooter } from "@heroui/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Label } from 'recharts';
import type { Problem, Category } from "@/types/report";
import { TrendingUp } from "lucide-react";

interface ProblemChartsProps {
    problems: Problem[];
    categories: Category[];
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

// HeroUI color scheme
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

export function ProblemCharts({ problems, categories }: ProblemChartsProps) {
    // Prepare data for category distribution chart
    const categoryData: ChartData[] = categories.map(category => ({
        name: category.name.en,
        count: problems.filter(p => p.categoryId === category.id).length,
        color: category.color
    }));


    // Prepare data for status distribution chart
    const statusData: ChartData[] = [
        { name: 'Pending', value: problems.filter(p => p.status === 'Pending').length },
        { name: 'In-Progress', value: problems.filter(p => p.status === 'In-Progress').length },
        { name: 'Done', value: problems.filter(p => p.status === 'Done').length }
    ];

    const totalProblems = problems.length;
    const doneProblems = problems.filter(p => p.status === 'Done').length;
    const resolutionRate = totalProblems > 0 ? (doneProblems / totalProblems * 100).toFixed(1) : 0;

    return (
        <Card className="bg-white mb-6">
            <CardBody>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Category Distribution Chart */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Problems by Category</h3>
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
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
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill={COLORS.primary}
                                        dataKey="value"
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
                                                            x={viewBox.cx}
                                                            y={viewBox.cy}
                                                            textAnchor="middle"
                                                            dominantBaseline="middle"
                                                        >
                                                            <tspan
                                                                x={viewBox.cx}
                                                                y={viewBox.cy}
                                                                className="fill-foreground text-2xl font-bold"
                                                            >
                                                                {resolutionRate}%
                                                            </tspan>
                                                            <tspan
                                                                x={viewBox.cx}
                                                                y={(viewBox.cy || 0) + 24}
                                                                className="fill-muted-foreground text-sm"
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