"use client";

import React, { useState } from "react";
import { Smile } from "lucide-react";
import { addToast } from "@heroui/react";

import StickerAccordion from "./_components/StickerAccordion";
import { StickerModal } from "./_components/StickerModal";

import { PageHeader } from "@/components/ui/page-header";
import { useSticker } from "@/hooks/useSticker";
import { Sticker } from "@/types/sticker";
import { ConfirmationModal } from "@/components/modal/ConfirmationModal";


export default function StickerPage() {
    const { stickers, loading, createSticker, deleteSticker, updateSticker, fetchStickers } = useSticker();
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmationModalType, setConfirmationModalType] = useState<
        'delete' | 'edit' | null
    >(null);
    const [selectedSticker, setSelectedSticker] = useState<Sticker | undefined>();

    const handleAddSticker = () => {
        setModalMode('add');
        setSelectedSticker(undefined);
        setIsModalOpen(true);
    };

    const handleEditSticker = (sticker: Sticker) => {
        setModalMode('edit');
        setSelectedSticker(sticker);
        setIsModalOpen(true);
    };

    const handleDeleteSticker = (sticker: Sticker) => {
        setSelectedSticker(sticker);
        setConfirmationModalType('delete');
    };

    const handleSubmitSticker = async (formData: FormData, mode: "add" | "edit") => {
        try {
            const stickerId = selectedSticker?.id || selectedSticker?._id;

            if (mode === "edit" && stickerId && typeof stickerId === 'string') {
                const res = await updateSticker(stickerId, formData);

                if (res.statusCode === 200 || res.statusCode === 201) {
                    addToast({ title: "Sticker updated successfully!", color: "success" });
                } else {
                    addToast({ title: res.message || "Failed to update sticker", color: "danger" });
                    console.error("[Sticker] Update error:", res);
                }
            } else if (mode === "add") {
                const res = await createSticker(formData);

                if (res.statusCode === 200 || res.statusCode === 201) {
                    addToast({ title: "Sticker added successfully!", color: "success" });
                } else {
                    addToast({ title: res.message || "Failed to add sticker", color: "danger" });
                    console.error("[Sticker] Add error:", res);
                }
            }
            await fetchStickers();
        } catch (err) {
            addToast({ title: "Error while saving sticker", color: "danger" });
            console.error("[Sticker] Save error:", err);
        } finally {
            setIsModalOpen(false);
        }
    };

    const handleConfirm = async () => {
        try {
            const stickerId = selectedSticker?.id || selectedSticker?._id;

            if (confirmationModalType === 'delete' && stickerId && typeof stickerId === 'string') {
                const res = await deleteSticker(stickerId);

                if (res.statusCode === 200 || res.statusCode === 201) {
                    addToast({ title: 'Sticker deleted successfully!', color: 'success' });
                } else {
                    addToast({ title: res.message || 'Failed to delete sticker', color: 'danger' });
                    console.error("[Sticker] Delete error:", res);
                }
                await fetchStickers();
            }
        } catch (err) {
            addToast({ title: "Error while deleting sticker", color: "danger" });
            console.error("[Sticker] Delete error:", err);
        } finally {
            setConfirmationModalType(null);
            setSelectedSticker(undefined);
        }
    };

    return (
        <>
            <PageHeader 
                description="Manage chat stickers"
                icon={<Smile />}
                title="Sticker Management"
            />

            <div className="flex flex-col gap-6">
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <StickerAccordion
                        stickers={stickers}
                        onAdd={handleAddSticker}
                        onDelete={handleDeleteSticker}
                        onEdit={handleEditSticker}
                    />
                )}
            </div>

            {/* Modals */}
            <StickerModal
                isOpen={isModalOpen}
                mode={modalMode}
                sticker={selectedSticker}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSubmitSticker}
            />

            <ConfirmationModal
                body="Are you sure you want to delete this sticker?"
                confirmColor="danger"
                isOpen={confirmationModalType === "delete"}
                selectedKeys={new Set()}
                title="Delete sticker"
                userAction={{ _id: "system", username: "admin", name: { first: "System", last: "Admin" }, role: { _id: "admin", name: "Admin" } }}
                onClose={() => setConfirmationModalType(null)}
                onConfirm={handleConfirm}
            />
        </>
    );
} 