'use client'

import { useSystem } from "@/hooks/useSystem";

import { useState } from "react";
import { System } from "@/types/system";
import { addToast } from "@heroui/react";
import { ConfirmationModal } from "@/components/modal/ConfirmationModal";
import { SystemCard } from "./_components/SystemCard";

export default function SystemPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSystem, setSelectedSystem] = useState<System | null>(null);
    const { systems, updateSystem } = useSystem();

    const handleUpdateSystem = (system: System) => {
        setSelectedSystem(system);
        setIsModalOpen(true);
    };

    const handleConfirm = async () => {
        if (!selectedSystem) return;

        const updatedStatus = !selectedSystem.status;

        await updateSystem(selectedSystem._id, {
            ...selectedSystem,
            status: updatedStatus,
        });

        addToast({
            title: "System status updated successfully",
            color: "success",
        });

        setSelectedSystem(null);
        setIsModalOpen(false);
    };

    return (
        <div className="flex flex-col min-h-screen">
            <div className="container mx-auto px-4">
                <h1 className="text-3xl font-bold mb-8">Settings</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {systems.map((system) => (
                        <SystemCard
                            key={system._id}
                            system={system}
                            onClick={handleUpdateSystem}
                        />
                    ))}
                </div>
            </div>

            <ConfirmationModal
                body={
                    selectedSystem?.status
                        ? "Are you sure you want to close the system?"
                        : "Are you sure you want to open the system?"
                }
                confirmColor={selectedSystem?.status ? "danger" : "success"}
                confirmText={selectedSystem?.status ? "Close" : "Open"}
                isOpen={isModalOpen}
                title={selectedSystem?.status ? "Close system" : "Open system"}
                onClose={() => {
                    setSelectedSystem(null);
                    setIsModalOpen(false);
                }}
                onConfirm={handleConfirm}
            />

        </div>
    );
}
