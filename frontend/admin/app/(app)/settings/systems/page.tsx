'use client'

import { useState, useEffect } from "react";
import { addToast, Button } from "@heroui/react";
import { useRouter } from "next/navigation";

import { SystemCard } from "./_components/SystemCard";

import { useSystem } from "@/hooks/useSystem";
import { System } from "@/types/system";
import { ConfirmationModal } from "@/components/modal/ConfirmationModal";



export default function SystemPage() {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSystem, setSelectedSystem] = useState<System | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [showConfirmButtons, setShowConfirmButtons] = useState(false);
    const { systems, updateSystem } = useSystem();

    const handleUpdateSystem = (system: System) => {
        setSelectedSystem(system);
        setIsModalOpen(true);
        
        if (system.status) {
            setCountdown(10);
            setShowConfirmButtons(false);
        } else {
            setCountdown(null);
            setShowConfirmButtons(true);
        }
    };

    useEffect(() => {
        if (countdown === null || countdown <= 0) return;

        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev === null) return null;
                if (prev <= 1) {
                    setShowConfirmButtons(true);

                    return 0;
                }

                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [countdown]);

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

        handleCloseModal();
    };

    const handleCloseModal = () => {
        setSelectedSystem(null);
        setIsModalOpen(false);
        setCountdown(null);
        setShowConfirmButtons(false);
    };

    const renderModalContent = () => {
        if (!selectedSystem) return "";

        if (selectedSystem.status && countdown !== null && countdown > 0) {
            return (
                <div className="text-center py-6">
                    <div className="text-6xl font-bold text-red-500 mb-4 font-mono animate-pulse">
                        {countdown}
                    </div>
                    <p className="text-lg mb-2">
                        System will be prepared for shutdown...
                    </p>
                    <p className="text-sm text-gray-500">
                        Please wait for confirmation options
                    </p>
                </div>
            );
        }

        return selectedSystem.status
            ? "Are you sure you want to close the system?"
            : "Are you sure you want to open the system?";
    };

    return (
        <div className="flex flex-col min-h-screen">
            <div className="container mx-auto px-4">
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        color="primary"
                        startContent={
                            <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 12H5M12 19l-7-7 7-7"/>
                            </svg>
                        }
                        variant="light"
                        onPress={() => router.back()}
                    >
                        Back
                    </Button>
                    <h1 className="text-3xl font-bold">System Management</h1>
                </div>

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
                body={renderModalContent() as string}
                confirmColor={selectedSystem?.status ? "danger" : "success"}
                confirmText={selectedSystem?.status ? "Close" : "Open"}
                isOpen={isModalOpen}
                title={selectedSystem?.status ? "Close system" : "Open system"}
                onClose={handleCloseModal}
                onConfirm={countdown !== null && countdown > 0 ? undefined : handleConfirm}
            />
        </div>
    );
}