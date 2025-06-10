import React from 'react';
import { ScanBarcode, User as UserIcon, Activity as ActivityIcon, Ticket, Gem, } from 'lucide-react';
import { Checkin } from '@/types/checkin';
import { User } from '@/types/user';
import { Activities } from '@/types/activities';
import { Evoucher } from '@/types/evoucher';
import { Sponsors } from '@/types/sponsors';
import { Card, CardBody } from '@heroui/react';

interface Overviewprop {
    checkin: Checkin[];
    Users: User[];
    Activities: Activities[];
    Evouchers: Evoucher[];
    Sponsors: Sponsors[];
    isLoading: boolean;
}


const CardWithPie = ({ label, value, icon, colors }: {
    label: string;
    value: string;
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

export default function Overview({ checkin, Users, Activities, Evouchers, Sponsors, isLoading }: Overviewprop) {

    const checkInTotal = checkin.length;
    const studentTotal = Users.length;
    const activityTotal = Activities.length;
    const sponsorTotal = Sponsors.length;

    if (isLoading) return <p>Loading...</p>;
    return (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 my-6">
            <CardWithPie
                label="Check In"
                value={checkInTotal.toString()}
                icon={<ScanBarcode />}
                colors='gray-100'
            />
            <CardWithPie
                label="Student"
                value={studentTotal.toString()}
                icon={<UserIcon />}
                colors='blue-100'
            />
            <CardWithPie
                label="Activity"
                value={activityTotal.toString()}
                icon={<ActivityIcon />}
                colors='green-100'
            />
            <CardWithPie
                label="Evoucher"
                value={Evouchers.length.toString()}
                icon={<Ticket />}
                colors='red-100'
            />
            <CardWithPie
                label="Sponsors"
                value={sponsorTotal.toString()}
                icon={<Gem />}
                colors='purple-100'
            />
        </div>
    );
}
