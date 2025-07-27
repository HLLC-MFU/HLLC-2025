import React from 'react';
import { User as UserIcon, TicketCheck, Book, BookCopyIcon, } from 'lucide-react';
import { Divider } from '@heroui/react';

import CardStat from './CardStat';

import { Checkin } from '@/types/checkin';
import { Evoucher } from '@/types/evoucher';
import { Sponsors } from '@/types/sponsors';
import { UseruseSystem } from '@/types/user-stats'

interface Overviewprop {
    checkin: Checkin[];
    Userstats: UseruseSystem;
    Activities: { type: string; count: number }[];
    Evouchers: Evoucher[];
    Sponsors: Sponsors[];
    isLoading: boolean;
}



export default function Overview({ Activities, Userstats, Evouchers, Sponsors }: Overviewprop) {

    const fresher = Userstats.Fresher || 0;
    const Evoucherstotle = Evouchers.length;
    const sponsorTotal = Sponsors.length;


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

            <CardStat
                colors="green-100"
                icon={<Book className="w-4 h-4" />}
                label="Activities"
            >
                {Activities.length === 0 ? (
                    <p className="text-sm text-gray-500">No activities found</p>
                ) : (
                    <div className="flex flex-row gap-4 w-full items-stretch">
                        {Activities.map((activity, index) => (
                            <React.Fragment key={activity.type}>
                                <div className="flex flex-col gap-2 text-center flex-1">
                                    <p className="text-sm text-gray-500 capitalize">{activity.type?.split(" ").pop() || "-"}</p>
                                    <p className="text-3xl font-semibold">{activity.count || 0}</p>
                                </div>
                                {index < Activities.length - 1 && (
                                    <Divider orientation="vertical" />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                )}
            </CardStat>
        </div>
    );
}
