import { Checkin } from "@/types/checkin";
import {
    ResponsiveContainer,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    Bar,
    BarChart,
} from "recharts";
import { transformCheckinData } from "../utils/transformCheckinData";

type FresherCheckinDashboard = {
    checkIn: Checkin[];
};

export default function FresherCheckinDashboard({ checkIn }: FresherCheckinDashboard) {
    const chartData = transformCheckinData(checkIn);

    return (
        <ResponsiveContainer height="100%" width="100%">
            <BarChart
                data={chartData}
                barGap={1}
                margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
            >
                <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" />
                <XAxis dataKey="activty" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar barSize={20} dataKey="CheckIn" fill="#dd4398ff" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
} 
