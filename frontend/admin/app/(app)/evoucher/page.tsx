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
import { useEvoucher } from "@/hooks/useEvoucher";
import { useEvoucherType } from "@/hooks/useEvoucherType";
import { useSponsors } from "@/hooks/useSponsors";
import AddTypeModal from "./_components/AddTypeModal";
import { EvoucherType } from "@/types/evoucher-type";

export default function EvoucherPage() {
    const { evouchers } = useEvoucher();
    const { evoucherType, createEvoucherType } = useEvoucherType();
    const { sponsors } = useSponsors();
    const [isTypeOpen, setIsTypeOpen] = React.useState(false);

    const groupedEvouchers: Record<string, Evoucher[]> = {};
    evouchers.forEach((evoucher) => {
        const sponsorName = evoucher.sponsors?.name?.en || "Unknown";
        if (!groupedEvouchers[sponsorName]) groupedEvouchers[sponsorName] = [];
        groupedEvouchers[sponsorName].push(evoucher);
    });

    const handleAddType = (TypeName: Partial<EvoucherType>) => {
        createEvoucherType(TypeName);
        setIsTypeOpen(false);
      };

    return (
        <>
            <PageHeader description='This is Management Page' icon={<Ticket />} right={
                <Button color="primary" size="lg" endContent={<Plus size={20}/>} onPress={() => setIsTypeOpen(true)}>New Type</Button>
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
                                        sponsors={sponsors}
                                    />
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            </div>

            <AddTypeModal 
                isOpen={isTypeOpen}
                onClose={() => setIsTypeOpen(false)}
                onAddType={handleAddType}
            />
        </>
    )
}