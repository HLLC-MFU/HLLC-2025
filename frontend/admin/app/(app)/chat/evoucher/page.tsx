"use client";

import { Button } from "@heroui/react";
import { ArrowLeft, Gift, Send } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { EvoucherSelection } from "./_components/EvoucherSelection";
import { useEvoucherSend } from "./_hooks/useEvoucherSend";

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
                onEvoucherDataChange={handleEvoucherDataChange}
                onEvoucherSelect={handleEvoucherSelect}
                onRefresh={refreshEvouchers}
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
                >
                    Send Evoucher to Room
                            </Button>
                        </div>
        </div>
    );
} 