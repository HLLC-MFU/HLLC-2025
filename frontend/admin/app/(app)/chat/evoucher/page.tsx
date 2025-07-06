"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@heroui/react";
import { ArrowLeft, Gift, Send } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { EvoucherSelection } from "./_components/EvoucherSelection";
import { useEvoucherSend } from "./_hooks/useEvoucherSend";

export default function EvoucherPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const roomId = searchParams.get('roomId');
    
    const {
        evouchers,
        selectedEvoucher,
        evoucherData,
        loading,
        error,
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
                title="Send Evoucher"
                right={
                    <Button
                        variant="light"
                        startContent={<ArrowLeft size={20} />}
                        onPress={() => router.back()}
                    >
                        Back
                    </Button>
                }
            />

            <EvoucherSelection
                evouchers={evouchers}
                selectedEvoucher={selectedEvoucher}
                evoucherData={evoucherData}
                loading={loading}
                error={error}
                onEvoucherSelect={handleEvoucherSelect}
                onEvoucherDataChange={handleEvoucherDataChange}
                onRefresh={refreshEvouchers}
            />

            {/* Send Button */}
            <div className="flex justify-end">
                            <Button
                                color="primary"
                    size="lg"
                                startContent={<Send size={20} />}
                                onPress={handleSendEvoucher}
                    isLoading={sending}
                    isDisabled={!canSendEvoucher}
                >
                    Send Evoucher to Room
                            </Button>
                        </div>
        </div>
    );
} 