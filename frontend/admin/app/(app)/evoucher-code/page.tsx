"use client"

import React from "react";
import {
    Accordion,
    AccordionItem,
} from "@heroui/react";
import EvoucherCodeTable from './_components/EvoucherCodeTable'
import { PageHeader } from "@/components/ui/page-header";
import { Ticket } from "lucide-react";
import { useEvoucherCode } from "@/hooks/useEvoucherCode";
import { useSponsors } from "@/hooks/useSponsors";

export default function EvoucherCodePage() {
    const { evoucherCodes, loading: evoucherCodesLoading } = useEvoucherCode();
    const { sponsors, loading: sponsorsLoading } = useSponsors();

    const isLoading = evoucherCodesLoading || sponsorsLoading;

    // Group evoucher codes by sponsor
    const evoucherCodesBySponsors = sponsors.reduce((acc, sponsor) => {
        acc[sponsor._id] = evoucherCodes.filter(code => code.sponsors._id === sponsor._id);
        return acc;
    }, {} as Record<string, typeof evoucherCodes>);

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
        : sponsors.map(sponsor => (
            <AccordionItem
                key={sponsor._id}
                aria-label={`${sponsor.name.en} Evoucher Codes`}
                className="font-medium mb-2"
                title={
                    <div className="flex items-center gap-2">
                        <span>{sponsor.name.en} Evoucher Codes</span>
                        <span className="text-xs text-gray-500">
                            ({evoucherCodesBySponsors[sponsor._id]?.length || 0} code{evoucherCodesBySponsors[sponsor._id]?.length !== 1 ? "s" : ""})
                        </span>
                    </div>
                }
            >
                <EvoucherCodeTable
                    evoucherCodes={evoucherCodesBySponsors[sponsor._id] || []}
                    sponsors={sponsors}
                    sponsorId={sponsor._id}
                />
            </AccordionItem>
        ));

    return (
        <>
            <PageHeader 
                description='Manage evoucher codes' 
                icon={<Ticket />} 
                title="Evoucher Code Management"
            />
            
            <div className="flex flex-col gap-6">
                <Accordion className="px-0" variant="splitted">
                    {accordionItems}
                </Accordion>
            </div>
        </>
    )
} 