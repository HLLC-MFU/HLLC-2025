'use client';

import { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { Spinner } from '@heroui/react';

import { useActivities } from '@/hooks/useActivities';
import { useCheckin } from '@/hooks/useCheckin';

export default function ActivityCheckinChart() {
    const { activities } = useActivities({ autoFetch: true });
    const { fetchCheckinByActivity } = useCheckin(null);
    const [allCheckins, setAllCheckins] = useState<Record<string, any[]>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function fetchAll() {
            if (!activities.length) return;
            setLoading(true);
            const result: Record<string, any[]> = {};

            for (const activity of activities) {
                const checkins = await fetchCheckinByActivity(activity._id);
                result[activity._id] = checkins || [];
            }

            setAllCheckins(result);
            setLoading(false);
        }

        fetchAll();
    }, [activities]);

    // Group by activity name.en and sum checkins, plus track activity IDs per group
    const groupedData: Record<
        string,
        { checkins: number; fullName: string; activityIds: string[] }
    > = {};

    activities.forEach((activity) => {
        const fullName = activity.name?.en ?? 'Unnamed';
        const checkinCount = allCheckins[activity._id]?.length || 0;

        if (groupedData[fullName]) {
            groupedData[fullName].checkins += checkinCount;
            groupedData[fullName].activityIds.push(activity._id);
        } else {
            groupedData[fullName] = {
                checkins: checkinCount,
                fullName,
                activityIds: [activity._id],
            };
        }
    });

    // Log activity IDs per group
    // useEffect(() => {
    //     Object.entries(groupedData).forEach(([fullName, group]) => {
    //         console.log(`Activity IDs grouped under "${fullName}":`, group.activityIds);
    //     });
    // }, [groupedData]);

    const chartData = Object.entries(groupedData).map(([_, value]) => ({
        name: value.fullName,
        shortName: value.fullName.split(' ').pop() || value.fullName,
        checkins: value.checkins,
    }));

    return (
        <div className="w-full h-[360px]">
            {loading ? (
                <div className="flex items-center justify-center h-full">
                    <Spinner size="lg" />
                </div>
            ) : (
                <ResponsiveContainer height="100%" width="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                        <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" />
                        <XAxis dataKey="shortName" fontSize={10} interval={0} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="checkins" fill="#3b82f6" radius={[8, 8, 8, 8]} />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
