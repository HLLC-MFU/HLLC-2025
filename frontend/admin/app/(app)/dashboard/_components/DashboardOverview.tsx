import React from 'react';
import { ScanBarcode, User as UserIcon, Activity as ActivityIcon, Ticket, Gem, } from 'lucide-react';
import { Card } from '@heroui/react';

import { Checkin } from '@/types/checkin';
import { Activities } from '@/types/activities';
import { Evoucher } from '@/types/evoucher';
import { Sponsors } from '@/types/sponsors';
import { UseruseSystem } from '@/types/user-stats'

interface Overviewprop {
    checkin: Checkin[];
    Userstats: UseruseSystem;
    Activities: Activities[];
    Evouchers: Evoucher[];
    Sponsors: Sponsors[];
    isLoading: boolean;
}

const CardWithPie = ({ label, value, icon, colors }: {
    label: string;
    value: React.ReactNode;
    icon: React.ReactNode;
    colors: string;
}) => (
    <Card className='w-full h-full  border  rounded-2xl flex-row flex items-center gap-4 p-5 shadow-sm hover:shadow-lg transition-shadow'>
        <div className={`p-4 rounded-full bg-${colors} text-${colors.replace('100', '600')} shadow-inner`}>
            {icon}
        </div>
        <div className="flex flex-col">
            <span className="text-xl font-semibold text-gray-800 ">{value} </span>
            <span className="text-sm text-gray-500">{label}</span>
        </div>
    </Card>
);

export default function Overview({ checkin, Activities, Userstats, Evouchers, Sponsors, isLoading }: Overviewprop) {

    const checkInTotal = checkin.length;
    const registered = Object.values(Userstats).reduce((sum, user) => sum + user.registered, 0)
    const unregistered = Object.values(Userstats).reduce((sum, user) => sum + user.notRegistered, 0)
    const totalUsers = Object.values(Userstats).reduce((sum, user) => sum + user.total, 0)
    const Evoucherstotle = Evouchers.length;
    const activityTotal = Activities.length;
    const sponsorTotal = Sponsors.length;
    
    if (isLoading) return <p>Loading...</p>;

    return (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 my-6">
            <CardWithPie
                colors='gray-100'
                icon={<ScanBarcode />}
                label="Check In"
                value={checkInTotal.toString()}
            />
            <CardWithPie
                colors='blue-100'
                icon={<UserIcon />}
                label={`User (${totalUsers})`}
                value={<div className="flex gap-1 text-base">
                    <span > {registered}</span>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-400">{unregistered}</span>
                </div>}
            />
            <CardWithPie
                colors='green-100'
                icon={<ActivityIcon />}
                label="Activity"
                value={activityTotal.toString()}
            />
            <CardWithPie
                colors='red-100'
                icon={<Ticket />}
                label="Evoucher"
                value={Evoucherstotle.toString()}
            />
            <CardWithPie
                colors='purple-100'
                icon={<Gem />}
                label="Sponsors"
                value={sponsorTotal.toString()}
            />
        </div>
    );
}
