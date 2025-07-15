
import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

const Data = [
    {
        id: 1,
        PreTest: 20,
        CheckIn: 30,
        PostTest: 10,
        activty: 'Test',
    },
    {
        id: 2,
        PreTest: 15,
        CheckIn: 25,
        PostTest: 20,
        activty: 'Coding Camp',
    },
    {
        id: 3,
        PreTest: 10,
        CheckIn: 35,
        PostTest: 15,
        activty: 'Startup Talk',
    },
    {
        id: 4,
        PreTest: 18,
        CheckIn: 22,
        PostTest: 18,
        activty: 'UX/UI Workshop',
    },
    {
        id: 5,
        PreTest: 12,
        CheckIn: 28,
        PostTest: 25,
        activty: 'Hackathon 2025',
    },
    {
        id: 6,
        PreTest: 10,
        CheckIn: 35,
        PostTest: 15,
        activty: 'Startup Talk',
    },
    {
        id: 7,
        PreTest: 18,
        CheckIn: 22,
        PostTest: 18,
        activty: 'UX/UI Workshop',
    },
    {
        id: 8,
        PreTest: 12,
        CheckIn: 28,
        PostTest: 25,
        activty: 'Hackathon 2025',
    },
];


export default function Charts() {
    return (
        <>
            <ResponsiveContainer height="100%" width="100%">
                <BarChart barGap={5} data={Data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" />
                    <XAxis dataKey="activty" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar barSize={20} dataKey="PreTest" fill="#4C72B0" radius={[4, 4, 0, 0]} />
                    <Bar barSize={20} dataKey="CheckIn" fill="#55A868" radius={[4, 4, 0, 0]} />
                    <Bar barSize={20} dataKey="PostTest" fill="#EFC94C" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </>
    )
}