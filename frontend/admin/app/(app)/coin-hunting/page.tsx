'use client'

import { PageHeader } from "@/components/ui/page-header";
import { Coins, MapPin } from "lucide-react";
import SystemList from "../sponsor-systems/_components/SystemsList"

export default function CoinHuntingPage() {
    
    const site = [
        {
            title: 'Landmark',
            description: 'Landmark Management',
            icon: <MapPin />,
            href: '/coin-hunting/landmarks',
        },
        {
            title: 'Leaderboard',
            description: 'Coin Hunting Leaderboard',
            icon: <Coins />,
            href: '/coin-hunting/leaderboard',
        },
    ];

    return (
        <>
            <PageHeader description="Manage landmark and coin hunting" icon={<Coins />} />
            <div className="flex flex-col">
                <div className="grid grid-cols-1 gap-3">
                    {site.map((item, index) => (
                        <SystemList key={index} item={item} />
                    ))}
                </div>
            </div>
        </>
    );
}