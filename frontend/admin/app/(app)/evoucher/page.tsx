"use client"

import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Ticket } from "lucide-react";
import EvoucherAccordion from "./_components/EvoucherAccordion";
import { useEvoucher } from "@/hooks/useEvoucher";


export default function EvoucherPage() {
    const { evouchers, loading: evouchersLoading } = useEvoucher();
    const isLoading = evouchersLoading;
    return (
        <>
            <PageHeader
                description="Manage evouchers and their codes"
                icon={<Ticket />}
                title="Evoucher Management"
            />
            <div className="flex flex-col gap-6">
                {isLoading ? (
                    <p>Loading...</p>
                ) : (
                    <EvoucherAccordion
                        evouchers={evouchers}
                    />
                )}
            </div>

            {/* Modals */}
            {/* {tableLogic.isModalOpen && (
                <EvoucherModal
                    isOpen={tableLogic.isModalOpen}
                    onClose={() => {
                        tableLogic.setIsModalOpen(false);
                        setSelectedEvoucher(undefined);
                    }}
                    onSuccess={handleSuccess}
                    mode={tableLogic.actionText.toLowerCase() as "add" | "edit"}
                    evoucherType={evoucherType}
                    sponsors={sponsors}
                    evoucher={selectedEvoucher}
                />
            )}

            <ConfirmationModal
                isOpen={tableLogic.isDeleteOpen}
                onClose={() => {
                    tableLogic.setIsDeleteOpen(false);
                    setSelectedEvoucher(undefined);
                }}
                onConfirm={() => {
                    if (selectedEvoucher) {
                        tableLogic.handleDelete(selectedEvoucher._id);
                    }
                }}
                title={"Delete evoucher"}
                body={"Are you sure you want to delete this item?"}
                confirmColor='danger'
            /> */}
        </>
    )
}