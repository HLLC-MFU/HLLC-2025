import React from 'react';
import { Flower, Activity , TriangleAlert , TicketPercent  } from 'lucide-react';
import { Card } from '@heroui/react';
import { Activities } from '@/types/activities'
import { Evoucher } from '@/types/evoucher';
import { LamduanFlowers } from '@/types/lamduan-flowers';
import { Problem } from "@/types/report";

interface Overviewprop {
    activities: Activities[];
    evouchers: Evoucher[];
    lamduanFlowers: LamduanFlowers[];
    reports: Problem[];
    isLoading: boolean;
}

const CardWithPie = ({ label, value, icon, colors }: {
    label: string;
    value: React.ReactNode;
    icon: React.ReactNode;
    colors: string;
}) => (
    <Card className='w-full h-full rounded-2xl flex-row flex items-center gap-4 p-5'>
        <div className={`p-4 rounded-2xl bg-${colors} text-${colors.replace('100', '600')} shadow-inner`}>
            {icon}
        </div>
        <div className="flex flex-col">
            <span className="text-md font-medium text-gray-800">{label}</span>
            <span className="text-lg font-semibold text-gray-500 ">{value} </span>
        </div>
    </Card>
);

export default function Overview({ activities, evouchers , lamduanFlowers , reports , isLoading }: Overviewprop) {
    
    if ( isLoading ) return <p>Loading...</p>;

    return (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4  gap-6 my-6">
            <CardWithPie
                label="Total Activity"
                value={activities.length}
                icon={<Activity />}
                colors='green-100'
            />
            <CardWithPie
                label="LamduanFlower"
                value={lamduanFlowers.length}
                icon={<Flower className=' text-yellow-600' />}
                colors='yellow-100'
            />
            <CardWithPie
                label="Evoucher"
                value={evouchers.length}
                icon={<TicketPercent />}
                colors='orange-100'
            />
            <CardWithPie
                label="Report"
                value={reports.length}
                icon={<TriangleAlert />}
                colors='red-100'
            />
        </div>
    );
}
