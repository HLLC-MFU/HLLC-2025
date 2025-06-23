"use client"

import React from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Ticket, Image } from "lucide-react";
import { useEvoucherCode } from "@/hooks/useEvoucherCode";
import { useSponsors } from "@/hooks/useSponsors";
import { useEvoucher } from "@/hooks/useEvoucher";
import EvoucherCodeAccordion from "./_components/EvoucherCodeAccordion";

export default function EvoucherCodePage() {
    const { evoucherCodes, loading: evoucherCodesLoading } = useEvoucherCode();
    const { sponsors, loading: sponsorsLoading } = useSponsors();
    const { evouchers, loading: evouchersLoading } = useEvoucher();
    const isLoading = evoucherCodesLoading || sponsorsLoading || evouchersLoading;
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
                    evoucherCodes={evoucherCodes}
                    evouchers={evouchers}
                />
            </div>
        </>
    )
} 