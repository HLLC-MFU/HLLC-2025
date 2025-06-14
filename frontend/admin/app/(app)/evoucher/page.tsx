"use client"

import React, { useState } from "react";
import {
    Accordion,
    AccordionItem,
    Button,
    Image
} from "@heroui/react";
import EvoucherTable from './_components/EvoucherTable'
import { PageHeader } from "@/components/ui/page-header";
import { Plus, Ticket } from "lucide-react";
import { Evoucher } from "@/types/evoucher";
import { useEvoucher } from "@/hooks/useEvoucher";
import { useEvoucherType } from "@/hooks/useEvoucherType";
import { useSponsors } from "@/hooks/useSponsors";
import AddTypeModal from "./_components/AddTypeModal";
import { EvoucherType } from "@/types/evoucher-type";

export default function EvoucherPage() {
    const { evouchers, loading: evoucherLoading } = useEvoucher();
    const { evoucherType, createEvoucherType, loading: evoucherTypeLoading } = useEvoucherType();
    const { sponsors, loading: sponsorsLoading } = useSponsors();
    const [isTypeOpen, setIsTypeOpen] = useState(false);

    const isLoading = evoucherLoading || evoucherTypeLoading || sponsorsLoading;

    const groupedEvouchers: Record<string, Evoucher[]> = {};

    evouchers.forEach((evoucher) => {
        const sponsorId = evoucher.sponsors._id || "Unknown";

        if (!groupedEvouchers[sponsorId]) groupedEvouchers[sponsorId] = [];
        groupedEvouchers[sponsorId].push(evoucher);
    });

    const handleAddType = (TypeName: Partial<EvoucherType>) => {
        createEvoucherType(TypeName);
        setIsTypeOpen(false);
    };

    return (
        <>
            <PageHeader
                description='Manage evoucher and relative data.'
                icon={<Ticket />}
                right={
                    <Button
                        color="primary"
                        size="lg"
                        endContent={<Plus size={20} />} onPress={() => setIsTypeOpen(true)}
                    >
                        New Type
                    </Button>
                }
            />

            <div className="flex flex-col gap-6">
                <Accordion className="px-0" variant="splitted">
                    {isLoading ? (
                        Array.from({ length: 3 }).map((_, index) => (
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
                    ) : (
                        sponsors.map((sponsor) => {
                            const sponsorName = sponsor.name.en;
                            const evoucher = groupedEvouchers[sponsor._id] || [];

                            return (
                                <AccordionItem
                                    key={sponsorName}
                                    aria-label={sponsorName}
                                    className="font-medium mb-2"
                                    startContent={
                                        <Image
                                            src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${sponsor.photo}`}
                                            alt="Cover"
                                            width={50}
                                        />
                                    }
                                    title={sponsorName}
                                    subtitle={
                                        <p className="flex">
                                            <span className="text-primary ml-1">{`${evoucher.length} evouchers`}</span>
                                        </p>
                                    }
                                >
                                    <EvoucherTable
                                        sponsorName={sponsorName}
                                        evouchers={evoucher}
                                        EvoucherType={evoucherType}
                                        sponsors={sponsors}
                                    />
                                </AccordionItem>
                            );
                        })
                    )}
                </Accordion>
            </div>

            <AddTypeModal
                isOpen={isTypeOpen}
                onClose={() => setIsTypeOpen(false)}
                onAddType={handleAddType}
            />
        </>
    )
}