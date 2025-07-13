"use client";

import { Button } from "@heroui/react";
import { ArrowLeft, Gift, Send } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

import { EvoucherSelection } from "./_components/EvoucherSelection";
import { useEvoucherSend } from "@/hooks/useEvoucherSend";
import { useGolangApi } from "@/hooks/useApi";
import { PageHeader } from "@/components/ui/page-header";

export default function EvoucherPage() {
    const router = useRouter();
    const { loading } = useGolangApi();
    const [error, setError] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const roomId = searchParams.get('roomId');
    
    const {
        evouchers,
        selectedEvoucher,
        evoucherData,
        sending,
        canSendEvoucher,
        handleEvoucherSelect,
        handleEvoucherDataChange,
        handleSendEvoucher,
        refreshEvouchers,
    } = useEvoucherSend(roomId);

    // Clear error when evouchers change
    useEffect(() => {
        if (evouchers.length > 0) {
            setError(null);
        }
    }, [evouchers]);

    const handleRefresh = async () => {
        try {
            setError(null);
            await refreshEvouchers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to refresh evouchers');
        }
    };

    if (!roomId) {
        return (
            <div className="flex flex-col gap-6">
                <PageHeader 
                    description="Send evouchers to room members"
                    icon={<Gift />}
                    right={
                        <Button
                            startContent={<ArrowLeft size={20} />}
                            variant="light"
                            onPress={() => router.back()}
                        >
                            Back
                        </Button>
                    }
                    title="Send Evoucher"
                />
                <div className="p-6 text-center">
                    <p className="text-default-500">No room ID provided. Please go back and try again.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <PageHeader 
                description="Send evouchers to room members"
                icon={<Gift />}
                right={
                    <Button
                        startContent={<ArrowLeft size={20} />}
                        variant="light"
                        onPress={() => router.back()}
                    >
                        Back
                    </Button>
                }
                title="Send Evoucher"
            />

            <EvoucherSelection
                error={error}
                evoucherData={evoucherData}
                evouchers={evouchers}
                loading={loading}
                selectedEvoucher={selectedEvoucher}
                onEvoucherSelect={handleEvoucherSelect}
                onRefresh={handleRefresh}
            />

            {/* Send Button */}
            <div className="flex justify-end">
                <Button
                    color="primary"
                    isDisabled={!canSendEvoucher}
                    isLoading={sending}
                    size="lg"
                    startContent={<Send size={20} />}
                    onPress={handleSendEvoucher}
                    className="font-semibold"
                >
                    Send Evoucher to Room
                </Button>
            </div>
        </div>
    );
} 