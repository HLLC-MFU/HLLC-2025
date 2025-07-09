"use client"

import React, { useState } from "react";
import { Ticket } from "lucide-react";
import { addToast } from "@heroui/react";

import EvoucherAccordion from "./_components/EvoucherAccordion";
import { EvoucherModal } from "./_components/EvoucherModal";

import { PageHeader } from "@/components/ui/page-header";
import { useEvoucher } from "@/hooks/useEvoucher";
import { Evoucher, EvoucherType } from "@/types/evoucher";
import { ConfirmationModal } from "@/components/modal/ConfirmationModal";
import { useSponsors } from "@/hooks/useSponsors";


export default function EvoucherPage() {
    const { evouchers, loading: evouchersLoading, createEvoucher, deleteEvoucher, updateEvoucher, fetchEvouchers, } = useEvoucher();
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

    const handleSubmitEvoucher = async (formData: FormData, mode: "add" | "edit") => {
        try {
            if (mode === "edit" && selectedEvoucher && "_id" in selectedEvoucher && selectedEvoucher._id) {
                await updateEvoucher(selectedEvoucher._id, formData);
            } else if (mode === "add") {
                await createEvoucher(formData);
            }

            await fetchEvouchers();
            addToast({ title: `Evoucher ${mode === "add" ? "added" : "updated"} successfully!`, color: "success" });
        } catch (err) {
            addToast({ title: "Error while saving evoucher", color: "danger" });
        } finally {
            setIsModalOpen(false);
        }
    };

    const handleConfirm = async () => {
        if (
            confirmationModalType === 'delete' &&
            selectedEvoucher &&
            selectedEvoucher._id
        ) {
            await deleteEvoucher(selectedEvoucher._id);
            await fetchEvouchers();
            addToast({ title: 'Evoucher deleted successfully!', color: 'success' });
        }
        setConfirmationModalType(null);
        setSelectedEvoucher(undefined);
    };

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
                        onDelete={handleDelete}
                        onEdit={handleEditEvoucher}
                    />
                )}
            </div>

            {/* Modals */}
            <EvoucherModal
                evoucher={
                    modalMode === "edit" && selectedEvoucher && "_id" in selectedEvoucher
                        ? (selectedEvoucher as Evoucher)
                        : undefined
                }
                evoucherType={selectedEvoucher?.type ?? EvoucherType.GLOBAL}
                isOpen={isModalOpen}
                mode={modalMode}
                sponsors={sponsors}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSubmitEvoucher}
            />

            <ConfirmationModal
                body="Are you sure you want to delete this item?"
                confirmColor="danger"
                isOpen={confirmationModalType === "delete"}
                title="Delete evoucher"
                onClose={() => setConfirmationModalType(null)}
                onConfirm={handleConfirm}
            />
        </>
    )
}