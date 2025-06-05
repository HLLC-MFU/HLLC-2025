"use client"

import React from "react";
import {
    Accordion,
    AccordionItem,
    Button,
} from "@heroui/react";
import EvoucherTable from './_components/evoucher-table'
import { PageHeader } from "@/components/ui/page-header";
import { Plus, Ticket } from "lucide-react";
import { Evoucher } from "@/types/evoucher";
import { ConfirmationModal } from "@/components/modal/ConfirmationModal";
import AddModal from "./_components/AddModal";
import { useEvoucher } from "@/hooks/useEvoucher";
import { useEvoucherType } from "@/hooks/useEvoucherType";

export default function EvoucherPage() {

    const { evouchers } = useEvoucher();
    const { evoucherType } = useEvoucherType();

    // console.log(evouchers);

    const groupedEvouchers: Record<string, Evoucher[]> = {};
    evouchers.forEach((evoucher) => {
        const sponsorName = evoucher.sponsors?.name?.en || "Unknown";
        if (!groupedEvouchers[sponsorName]) groupedEvouchers[sponsorName] = [];
        groupedEvouchers[sponsorName].push(evoucher);
    });

    return (
        <>
            <PageHeader description='This is Management Page' icon={<Ticket />} right={
                <Button color="primary" size="lg" endContent={<Plus size={20}/>}>New Type</Button>
            }/>
            <div className="flex flex-col min-h-screen">
                <div className="container mx-auto">
                    <div className="flex flex-col gap-6">
                        <Accordion variant="splitted" selectionMode="multiple">
                            {Object.entries(groupedEvouchers).map(([sponsorName, evouchers]) => (
                                <AccordionItem
                                    key={sponsorName}
                                    aria-label={sponsorName}
                                    title={sponsorName}
                                    className="font-medium mb-2"
                                >
                                    <EvoucherTable
                                        sponsorName={sponsorName}
                                        evouchers={evouchers}
                                        EvoucherType={evoucherType}
                                    />
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            </div>
        </>
    )
}