"use client"

import React from "react";
import {
    Accordion,
    AccordionItem,
} from "@heroui/react";
import EvoucherTable from './_components/Evoucher-table'


const mockupData: Evoucher[] = [
    {
        discount: 10,
        acronym: "EVA1",
        type: { name: "Individual" },
        sponsor: {
            name: { en: "Sponsor A", th: "ผู้สนับสนุน A" },
        },
        detail: { en: "Discount on summer products", th: "ส่วนลดฤดูร้อน" },
        expiration: new Date("2025-12-31"),
    },
    {
        discount: 15,
        acronym: "EVA2",
        type: { name: "Global" },
        sponsor: {
            name: { en: "Sponsor A", th: "ผู้สนับสนุน A" },
        },
        detail: { en: "Special offer for new members", th: "ข้อเสนอพิเศษสำหรับสมาชิกใหม่" },
        expiration: new Date("2025-10-31"),
    },
    {
        discount: 20,
        acronym: "EVB1",
        type: { name: "Individual" },
        sponsor: {
            name: { en: "Sponsor B", th: "ผู้สนับสนุน B" },
        },
        detail: { en: "Back-to-school discount", th: "ส่วนลดกลับไปโรงเรียน" },
        expiration: new Date("2025-09-30"),
    },
    {
        discount: 25,
        acronym: "EVB2",
        type: { name: "Global" },
        sponsor: {
            name: { en: "Sponsor B", th: "ผู้สนับสนุน B" },
        },
        detail: { en: "Autumn special offer", th: "ข้อเสนอพิเศษฤดูใบไม้ร่วง" },
        expiration: new Date("2025-11-15"),
    },
    {
        discount: 30,
        acronym: "EVB3",
        type: { name: "Individual" },
        sponsor: {
            name: { en: "Sponsor B", th: "ผู้สนับสนุน B" },
        },
        detail: { en: "Winter wonderland", th: "มหัศจรรย์ฤดูหนาว" },
        expiration: new Date("2025-12-01"),
    },
];

import { Evoucher } from "@/types/evoucher";

export default function EvoucherPage() {

    const [evouchers, setEvouchers] = React.useState<Evoucher[]>([]);

    React.useEffect(() => {
        setEvouchers(mockupData);
    }, []);

    const groupedEvouchers: Record<string, typeof evouchers> = {};
    evouchers.forEach((evoucher) => {
        const sponsorName = evoucher.sponsor?.name?.en || "Unknown";
        if (!groupedEvouchers[sponsorName]) groupedEvouchers[sponsorName] = [];
        groupedEvouchers[sponsorName].push(evoucher);
    });

    return (
        <div className="flex flex-col min-h-screen">
            <div className="container mx-auto py-6">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">Evoucher Management</h1>
                </div>

                <div className="flex flex-col gap-6">
                    <Accordion variant="splitted" selectionMode="multiple">
                        {Object.entries(groupedEvouchers).map(([sponsorName, sponsorEvouchers]) => (
                            <AccordionItem
                                key={sponsorName}
                                aria-label={sponsorName}
                                title={sponsorName}
                                className="font-medium mb-2"
                            >
                                <EvoucherTable sponsorName={sponsorName} evouchers={sponsorEvouchers} />
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
        </div>
    )
}