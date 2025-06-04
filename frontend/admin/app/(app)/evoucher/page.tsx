"use client"

import React from "react";
import {
    Accordion,
    AccordionItem,
} from "@heroui/react";
import EvoucherTable from './_components/Evoucher-table'
import { PageHeader } from "@/components/ui/page-header";
import { Ticket } from "lucide-react";
import { Evoucher } from "@/types/evoucher";
import { ConfirmationModal } from "@/components/modal/ConfirmationModal";
import AddModal from "./_components/AddModal";
import { useEvoucher } from "@/hooks/useEvoucher";

export default function EvoucherPage() {

    const { evouchers } = useEvoucher();
    const [actionText, setActionText] = React.useState<"Add" | "Edit">("Add");
    const [isAddOpen, setIsAddOpen] = React.useState<boolean>(false);
    const [isDeleteOpen, setIsDeleteOpen] = React.useState<boolean>(false);

    console.log(evouchers);

    const groupedEvouchers: Record<string, typeof evouchers> = {};
    evouchers.forEach((evoucher) => {
        const sponsorName = evoucher.sponsor?.name?.en || "Unknown";
        if (!groupedEvouchers[sponsorName]) groupedEvouchers[sponsorName] = [];
        groupedEvouchers[sponsorName].push(evoucher);
    });

    const handleAdd = () => {
        setIsAddOpen(true);
    };

    const handleDelete = () => {
        setIsDeleteOpen(true);
    };

    return (
        <>
            <PageHeader description='This is Management Page' icon={<Ticket />} />
            <div className="flex flex-col min-h-screen">
                <div className="container mx-auto">
                    <div className="flex flex-col gap-6">
                        <Accordion variant="splitted" selectionMode="multiple">
                            {Object.entries(groupedEvouchers).map(([sponsorName, sponsorEvouchers]) => (
                                <AccordionItem
                                    key={sponsorName}
                                    aria-label={sponsorName}
                                    title={sponsorName}
                                    className="font-medium mb-2"
                                >
                                    <EvoucherTable
                                        sponsorName={sponsorName}
                                        evouchers={sponsorEvouchers}
                                        setIsAddOpen={setIsAddOpen}
                                        setIsDeleteOpen={setIsDeleteOpen}
                                        setActionText={setActionText}
                                    />
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>

                <AddModal
                    isOpen={isAddOpen}
                    onClose={() => setIsAddOpen(false)}
                    onAdd={handleAdd}
                    title={actionText}
                />

                {/* Delete Modal */}
                <ConfirmationModal
                    isOpen={isDeleteOpen}
                    onClose={() => setIsDeleteOpen(false)}
                    onConfirm={handleDelete}
                    title={"Delete evoucher"}
                    body={"Are you sure you want to delete this item?"}
                    confirmColor='danger'
                />
            </div>
        </>
    )
}