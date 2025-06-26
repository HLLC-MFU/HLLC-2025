"use client"

import React from "react";
import {
    Accordion,
    AccordionItem,
} from "@heroui/react";
import EvoucherCodeTable from './_components/EvoucherCodeTable'
import { PageHeader } from "@/components/ui/page-header";
import { Ticket, Image } from "lucide-react";
import { useEvoucherCode } from "@/hooks/useEvoucherCode";
import { useSponsors } from "@/hooks/useSponsors";
import { useEvoucher } from "@/hooks/useEvoucher";

export default function EvoucherCodePage() {
    const { evoucherCodes, loading: evoucherCodesLoading } = useEvoucherCode();
    const { sponsors, loading: sponsorsLoading } = useSponsors();
    const { evouchers, loading: evouchersLoading } = useEvoucher();
    const isLoading = evoucherCodesLoading || sponsorsLoading || evouchersLoading;

    // Group evouchers by sponsor first
    const evouchersBySponsors = React.useMemo(() => {
        const groupedEvouchers = new Map();
        evouchers.forEach(evoucher => {
            const sponsorId = evoucher.sponsors._id;
            const sponsorName = evoucher.sponsors.name.en;
            if (sponsorName && !groupedEvouchers.has(sponsorId)) {
                const sponsorPhoto = evoucher.sponsors.photo as { logoPhoto?: string } | undefined;
                groupedEvouchers.set(sponsorId, {
                    name: sponsorName,
                    evouchers: [],
                    photo: sponsorPhoto?.logoPhoto || "",
                });
            }
            if (sponsorId) {
                groupedEvouchers.get(sponsorId).evouchers.push(evoucher);
            }
        });
        return groupedEvouchers;
    }, [evouchers]);

    // Then group evoucher codes by sponsor
    const evoucherCodesBySponsor = React.useMemo(() => {
        const groupedCodes = new Map();
        
        // Initialize the map with sponsor data from evouchersBySponsors
        Array.from(evouchersBySponsors.entries()).forEach(([sponsorId, data]) => {
            groupedCodes.set(sponsorId, {
                ...data,
                codes: []
            });
        });
        
        // Add evoucher codes to their respective sponsor groups
        evoucherCodes.forEach(code => {
            const sponsorId = code.evoucher?.sponsors?._id;
            if (sponsorId && groupedCodes.has(sponsorId)) {
                // Check if code is already added
                const existingCodes = groupedCodes.get(sponsorId).codes;
                const isDuplicate = existingCodes.some((existingCode: { _id: string }) => 
                    existingCode._id === code._id
                );
                
                if (!isDuplicate) {
                    groupedCodes.get(sponsorId).codes.push(code);
                }
            }
        });

        return groupedCodes;
    }, [evouchersBySponsors, evoucherCodes]);

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
        : Array.from(evoucherCodesBySponsor.entries()).map(([sponsorId, data]) => (
            <AccordionItem
                key={sponsorId}
                aria-label={`${data.name} Evoucher Codes`}
                className="font-medium mb-2"
                startContent={
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-default-200">
                        {data.photo ? (
                            <img
                                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${data.photo}`}
                                alt={data.name}
                                className="h-full w-full object-contain rounded border border-default-300 bg-white"
                                onError={(e) => {
                                    console.error('Failed to load image:', e.currentTarget.src);
                                    e.currentTarget.style.display = 'none';
                                    const parent = e.currentTarget.parentElement;
                                    if (parent) {
                                        parent.classList.add('flex', 'items-center', 'justify-center', 'text-default-400');
                                    }
                                }}
                            />
                        ) : null}
                        <div className={`absolute inset-0 ${!data.photo ? 'flex' : 'hidden'} items-center justify-center text-default-400`}>
                            <Image size={16} />
                        </div>
                    </div>
                }
                title={
                    <div className="flex items-center gap-2">
                        <span>{data.name} Evoucher Codes</span>
                        <span className="text-xs text-gray-500">
                            ({data.codes?.length || 0} code{(data.codes?.length || 0) !== 1 ? "s" : ""})
                        </span>
                    </div>
                }
            >
                <EvoucherCodeTable
                    evoucherCodes={data.codes || []}
                    sponsors={sponsors}
                    evouchers={data.evouchers}
                    sponsorId={sponsorId}
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