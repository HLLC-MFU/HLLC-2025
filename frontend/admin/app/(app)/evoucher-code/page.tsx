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

    // Group evoucher codes by sponsor
    const evoucherCodesBySponsors = React.useMemo(() => {
        const groupedCodes = new Map();
        evoucherCodes.forEach(code => {
            const sponsorName = code.evoucher?.sponsors?.name.en;
            if (sponsorName && !groupedCodes.has(sponsorName)) {
                const sponsorPhoto = code.evoucher?.sponsors?.photo as { logoPhoto?: string } | undefined;
                console.log('Sponsor photo data:', {
                    name: sponsorName,
                    photo: sponsorPhoto?.logoPhoto,
                    fullPath: sponsorPhoto?.logoPhoto ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/${sponsorPhoto.logoPhoto}` : null
                });
                groupedCodes.set(sponsorName, {
                    codes: [],
                    photo: sponsorPhoto?.logoPhoto || ""
                });
            }
            if (sponsorName) {
                groupedCodes.get(sponsorName).codes.push(code);
            }
        });
        return groupedCodes;
    }, [evoucherCodes]);

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
        : Array.from(evoucherCodesBySponsors.entries()).map(([sponsorName, { codes, photo }]) => (
            <AccordionItem
                key={sponsorName}
                aria-label={`${sponsorName} Evoucher Codes`}
                className="font-medium mb-2"
                startContent={
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-default-200">
                        {photo ? (
                            <img
                                src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${photo}`}
                                alt={sponsorName}
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
                        <div className={`absolute inset-0 ${!photo ? 'flex' : 'hidden'} items-center justify-center text-default-400`}>
                            <Image size={16} />
                        </div>
                    </div>
                }
                title={
                    <div className="flex items-center gap-2">
                        <span>{sponsorName} Evoucher Codes</span>
                        <span className="text-xs text-gray-500">
                            ({codes.length} code{codes.length !== 1 ? "s" : ""})
                        </span>
                    </div>
                }
            >
                <EvoucherCodeTable
                    evoucherCodes={codes}
                    sponsors={sponsors}
                    sponsorName={sponsorName}
                    evouchers={evouchers}
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