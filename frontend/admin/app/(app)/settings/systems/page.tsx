'use client'

import { useSystem } from "@/hooks/useSystem";

import { useState, useEffect } from "react";
import { System } from "@/types/system";
import { addToast } from "@heroui/react";
import { ConfirmationModal } from "@/components/modal/ConfirmationModal";
import { SystemCard } from "./_components/SystemCard";

export default function SystemPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSystem, setSelectedSystem] = useState<System | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [showConfirmButtons, setShowConfirmButtons] = useState(false);
    const { systems, updateSystem } = useSystem();

    const handleUpdateSystem = (system: System) => {
        setSelectedSystem(system);
        setIsModalOpen(true);
        
        // ถ้าเป็น close system (status = true) ให้เริ่ม countdown
        if (system.status) {
            setCountdown(10); // เริ่มนับจาก 10 วินาที
            setShowConfirmButtons(false);
        } else {
            // ถ้าเป็น open system ให้แสดงปุ่มยืนยันทันที
            setCountdown(null);
            setShowConfirmButtons(true);
        }
    };

    // useEffect สำหรับ countdown
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

        // แสดง countdown สำหรับ close system
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

        // แสดงข้อความยืนยันปกติ
        return selectedSystem.status
            ? "Are you sure you want to close the system?"
            : "Are you sure you want to open the system?";
    };

    return (
        <div className="flex flex-col min-h-screen">
            <div className="container mx-auto px-4">
                <h1 className="text-3xl font-bold mb-8">System Management</h1>

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