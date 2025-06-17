"use client"

import React from "react";
import {
    Accordion,
    AccordionItem,
} from "@heroui/react";
import EvoucherTable from './_components/EvoucherTable'
import { PageHeader } from "@/components/ui/page-header";
import { Ticket, Globe, User } from "lucide-react";
import { useEvoucher } from "@/hooks/useEvoucher";
import { useSponsors } from "@/hooks/useSponsors";
import { EvoucherType } from "@/types/evoucher";



export default function EvoucherPage() {
    const { evouchers, loading: evouchersLoading } = useEvoucher();
    const { sponsors, loading: sponsorsLoading } = useSponsors();

    const isLoading = evouchersLoading || sponsorsLoading;

    const globalEvouchers = evouchers.filter(e => e.type === EvoucherType.GLOBAL);
    const individualEvouchers = evouchers.filter(e => e.type === EvoucherType.INDIVIDUAL);

    const evoucherIcons = {
        [EvoucherType.GLOBAL]: <Globe />,
        [EvoucherType.INDIVIDUAL]: <User />
    };

    const accordionItems = isLoading 
        ? Array.from({ length: 2 }).map((_, index) => (
            <AccordionItem
                key={`skeleton-${index}`}
                aria-label={`Loading ${index}`}
                title={
                    <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                }
            >
                <div className="h-[100px] w-full bg-gray-100 rounded-md animate-pulse" />
            </AccordionItem>
        ))
        : [
            <AccordionItem
                key="global"
                aria-label="Global Evouchers"
                className="font-medium mb-2"
                startContent={evoucherIcons[EvoucherType.GLOBAL]}
                title={
                    <div className="flex items-center gap-2">
                        <span>Global Evouchers</span>
                        <span className="text-xs text-gray-500">
                            ({globalEvouchers.length} evoucher{globalEvouchers.length !== 1 ? "s" : ""})
                        </span>
                    </div>
                }
            >
                <EvoucherTable
                    evouchers={globalEvouchers}
                    sponsors={sponsors}
                    sponsorName="Global"
                    evoucherType={EvoucherType.GLOBAL}
                />
            </AccordionItem>,
            <AccordionItem
                key="individual"
                aria-label="Individual Evouchers"
                className="font-medium mb-2"
                startContent={evoucherIcons[EvoucherType.INDIVIDUAL]}
                title={
                    <div className="flex items-center gap-2">
                        <span>Individual Evouchers</span>
                        <span className="text-xs text-gray-500">
                            ({individualEvouchers.length} evoucher{individualEvouchers.length !== 1 ? "s" : ""})
                        </span>
                    </div>
                }
            >
                <EvoucherTable
                    evouchers={individualEvouchers}
                    sponsors={sponsors}
                    sponsorName="Individual"
                    evoucherType={EvoucherType.INDIVIDUAL}
                />
            </AccordionItem>
        ];

    return (
        <>
            <PageHeader 
                description='Manage evouchers and their codes' 
                icon={<Ticket />} 
                title="Evoucher Management"
            />
            
            <div className="flex flex-col gap-6">
                <Accordion className="px-0" variant="splitted">
                    {accordionItems}
                </Accordion>
            </div>
        </>
    )
}