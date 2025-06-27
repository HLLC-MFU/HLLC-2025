"use client"

import React, { useCallback, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Ticket } from "lucide-react";
import { useEvoucherCode } from "@/hooks/useEvoucherCode";
import { useSponsors } from "@/hooks/useSponsors";
import { useEvoucher } from "@/hooks/useEvoucher";
import EvoucherCodeAccordion from "./_components/EvoucherCodeAccordion";
import { EvoucherCode } from "@/types/evoucher-code";
import { addToast } from "@heroui/react";
import { EvoucherCodeModal } from "./_components/EvoucherCodeModal";
import { ConfirmationModal } from "@/components/modal/ConfirmationModal";

export default function EvoucherCodePage() {
    const { createEvoucherCode, deleteEvoucherCode } = useEvoucherCode();
    const { sponsors, fetchEvoucherCodeBySponsorId: rawFetcher, } = useSponsors();
    const { evouchers } = useEvoucher();
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvoucherCode, setSelectedEvoucherCode] = useState<EvoucherCode | undefined>();
    const [confirmationModalType, setConfirmationModalType] = useState<
        'delete' | 'edit' | null
    >(null);
    const fetchEvoucherCodeBySponsorId = useCallback(
        async (sponsorId: string) => {
            const res = await rawFetcher(sponsorId);
            return res;
        },
        [rawFetcher]
    );

    const handleAddEvoucherCode = () => {
        setModalMode('add');
        setIsModalOpen(true);
    };

    const handleEditEvoucherCode = (evoucherCode: EvoucherCode) => {
        setModalMode('edit');
        setSelectedEvoucherCode(evoucherCode);
        setIsModalOpen(true);
    };

    const handleDelete = (evoucherCode: EvoucherCode) => {
        setSelectedEvoucherCode(evoucherCode);
        setConfirmationModalType('delete');
    };

    const handleSubmitEvoucherCode = async (evoucherCodeData: Partial<EvoucherCode>) => {
        if (selectedEvoucherCode && "_id" in selectedEvoucherCode && selectedEvoucherCode._id) {
            setSelectedEvoucherCode({ ...selectedEvoucherCode, ...evoucherCodeData });
            setConfirmationModalType('edit')
        } else {
            createEvoucherCode(evoucherCodeData);
            addToast({
                title: `Evoucher Code added successfully!`,
                color: "success"
            });
        }
        setIsModalOpen(false);
    };

    const handleConfirm = async () => {
        if (
            confirmationModalType === 'delete' &&
            selectedEvoucherCode &&
            selectedEvoucherCode._id
        ) {
            await deleteEvoucherCode(selectedEvoucherCode._id);
            addToast({ title: 'Evoucher code deleted successfully!', color: 'success' });
        }
        setConfirmationModalType(null);
        setSelectedEvoucherCode(undefined);
    };

    return (
        <>
            <PageHeader
                description='Manage evoucher codes'
                icon={<Ticket />}
                title="Evoucher Code Management"
            />

            <div className="flex flex-col gap-6">
                <EvoucherCodeAccordion
                    sponsors={sponsors}
                    evoucherCodes={fetchEvoucherCodeBySponsorId}
                    evouchers={evouchers}
                    onAdd={handleAddEvoucherCode}
                    onEdit={handleEditEvoucherCode}
                    onDelete={handleDelete}
                />
            </div>
            {/* Modals */}
            {isModalOpen && (
                <EvoucherCodeModal
                    isOpen={isModalOpen}
                    onClose={() => { setIsModalOpen(false); }}
                    onSuccess={handleSubmitEvoucherCode}
                    mode={modalMode}
                    evouchers={evouchers}
                    evoucherCode={selectedEvoucherCode}
                    sponsorId={sponsors[0]?._id}
                />
            )}

            <ConfirmationModal
                isOpen={confirmationModalType === "delete"}
                onClose={() => {
                    setConfirmationModalType(null);
                    setSelectedEvoucherCode(undefined);
                }}
                onConfirm={handleConfirm}
                title={"Delete evoucher code"}
                body={"Are you sure you want to delete this Evoucher code?"}
                confirmColor="danger"
            />
        </>
    )
} 