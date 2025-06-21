"use client"

import React, { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Ticket } from "lucide-react";
import EvoucherAccordion from "./_components/EvoucherAccordion";
import { useEvoucher } from "@/hooks/useEvoucher";
import { Evoucher, EvoucherType } from "@/types/evoucher";
import { addToast } from "@heroui/react";
import { ConfirmationModal } from "@/components/modal/ConfirmationModal";
import { EvoucherModal } from "./_components/EvoucherModal";
import { useSponsors } from "@/hooks/useSponsors";


export default function EvoucherPage() {
    const { evouchers, loading: evouchersLoading, createEvoucher, deleteEvoucher, updateEvoucher } = useEvoucher();
    const isLoading = evouchersLoading;
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmationModalType, setConfirmationModalType] = useState<
        'delete' | 'edit' | null
    >(null);
    const [selectedEvoucher, setSelectedEvoucher] = useState<
        Evoucher | Partial<Evoucher> | undefined
    >();
    const { sponsors, loading: sponsorsLoading } = useSponsors();


    const handleAddEvoucher = (type?: EvoucherType) => {
        setModalMode('add');
        setSelectedEvoucher(type ? { type } : undefined);
        setIsModalOpen(true);
    };

    const handleEditEvoucher = (evoucher: Evoucher) => {
        setModalMode('edit');
        setSelectedEvoucher(evoucher);
        setIsModalOpen(true);
    };

    const handleDelete = (evoucher: Evoucher) => {
        setSelectedEvoucher(evoucher);
        setConfirmationModalType('delete');
    };

    const handleSubmitEvoucher = (formData: FormData, mode: "add" | "edit") => {
        const evoucherData: Partial<Evoucher> = {};
        formData.forEach((value, key) => {
            (evoucherData as any)[key] = value;
        });

        if (mode === 'edit' && selectedEvoucher && '_id' in selectedEvoucher && selectedEvoucher._id) {
            updateEvoucher(selectedEvoucher._id, formData);
            setSelectedEvoucher({ ...selectedEvoucher, ...evoucherData });
        } else if (mode === 'add') {
            createEvoucher(formData);
            addToast({ title: 'Evoucher added successfully!', color: 'success' });
        }

        setIsModalOpen(false);
    };


    const handleConfirm = () => {
        if (
            confirmationModalType === 'delete' &&
            selectedEvoucher &&
            selectedEvoucher._id
        ) {
            deleteEvoucher(selectedEvoucher._id);
            addToast({
                title: 'Evoucher updated successfully!',
                color: 'success',
            });
        }
        setConfirmationModalType(null);
        setSelectedEvoucher(undefined);
    }


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
                        onAdd={handleAddEvoucher}
                        onEdit={handleEditEvoucher}
                        onDelete={handleDelete}
                    />
                )}
            </div>

            {/* Modals */}
            <EvoucherModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSubmitEvoucher}
                mode={modalMode}
                evoucherType={selectedEvoucher?.type ?? EvoucherType.GLOBAL}
                sponsors={sponsors}
                evoucher={
                    modalMode === "edit" && selectedEvoucher && "_id" in selectedEvoucher
                        ? (selectedEvoucher as Evoucher)
                        : undefined
                }
            />

            <ConfirmationModal
                isOpen={confirmationModalType === "delete"}
                onClose={() => setConfirmationModalType(null)}
                onConfirm={handleConfirm}
                title="Delete evoucher"
                body="Are you sure you want to delete this item?"
                confirmColor="danger"
            />
        </>
    )
}