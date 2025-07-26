import React from 'react';
import { ScanBarcode, User as UserIcon, Activity as ActivityIcon, Ticket, Gem, TicketCheck, } from 'lucide-react';
import { Card, Divider } from '@heroui/react';

import CardStat from './CardStat';

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
    const fresher = Userstats.Fresher || 0;
    // const registered = Object.values(Userstats).reduce((sum, user) => sum + user.registered, 0)
    // const unregistered = Object.values(Userstats).reduce((sum, user) => sum + user.notRegistered, 0)
    // const totalUsers = Object.values(Userstats).reduce((sum, user) => sum + user.total, 0)
    const Evoucherstotle = Evouchers.length;
    const activityTotal = Activities.length;
    const sponsorTotal = Sponsors.length;

    if (isLoading) return <p>Loading...</p>;

    return (
        <div className="w-full grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 my-6">
            <CardStat
                colors="blue-100"
                icon={<UserIcon className="w-4 h-4" />}
                label="Fresher"
            >
                <div className="flex flex-row gap-4 w-full">
                    <div className="flex flex-col gap-2 text-center flex-1">
                        <p className="text-sm text-gray-500">Registered</p>
                        <p className="text-3xl font-semibold">{fresher.registered ? fresher.registered : 0}</p>
                    </div>
                    <Divider orientation="vertical" />
                    <div className="flex flex-col gap-2 text-center flex-1">
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="text-3xl font-semibold">{fresher.total ? fresher.total : 0}</p>
                    </div>
                </div>
            </CardStat>

            <CardStat
                colors="red-100"
                icon={<TicketCheck className="w-4 h-4" />}
                label="Evouchers"
            >
                <div className="flex flex-row gap-4 w-full">
                    <div className="flex flex-col gap-2 text-center flex-1">
                        <p className="text-sm text-gray-500">Sponsors</p>
                        <p className="text-3xl font-semibold">{sponsorTotal.toString() ? sponsorTotal.toString() : 0}</p>
                    </div>
                    <Divider orientation="vertical" />
                    <div className="flex flex-col gap-2 text-center flex-1">
                        <p className="text-sm text-gray-500">Evoucher</p>
                        <p className="text-3xl font-semibold">{Evoucherstotle.toString() ? Evoucherstotle.toString() : 0}</p>
                    </div>
                </div>
            </CardStat>
            <CardWithPie
                colors='gray-100'
                icon={<ScanBarcode />}
                label="Check In"
                value={checkInTotal.toString()}
            />
            <CardWithPie
                colors='green-100'
                icon={<ActivityIcon />}
                label="Activity"
                value={activityTotal.toString()}
            />
        </div>
    );
}
