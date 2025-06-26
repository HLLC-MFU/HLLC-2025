import React from 'react';
import { ScanBarcode, User as UserIcon, Activity as ActivityIcon, Ticket, Gem, UserRoundX } from 'lucide-react';
import { Checkin } from '@/types/checkin';
import { Card } from '@heroui/react';
import { UseruseSystem } from '@/types/user-stats'

interface Overviewprop {
    checkin: Checkin[];
    Userstats: UseruseSystem;
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

export default function Overview({ checkin, Userstats, isLoading }: Overviewprop) {

    const studentstats  = Userstats?.student
    const checkInTotal = checkin.length;

    
    if (isLoading || !studentstats) return <p>Loading...</p>;

    return (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 my-6">
            <CardWithPie
                label="Check In Staff"
                value={checkInTotal.toString()}
                icon={<ScanBarcode />}
                colors='gray-100'
            />
            <CardWithPie
                label="Check In Student"
                value={checkInTotal.toString()}
                icon={<UserIcon />}
                colors='blue-100'
            />
            <CardWithPie
                label="Totel Student"
                value={studentstats?.total  ?? 0}
                icon={<ActivityIcon />}
                colors='green-100'
            />
            <CardWithPie
                label="RegisterStudent"
                value={studentstats?.registered  ?? 0}
                icon={<Ticket />}
                colors='red-100'
            />
            <CardWithPie
                label="NotRegisterStudent"
                value={studentstats?.notRegistered ?? 0}
                icon={<Gem />}
                colors='purple-100'
            />
        </div>
    );
}
