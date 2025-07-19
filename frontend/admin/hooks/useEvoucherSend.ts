"use client";

import { addToast } from "@heroui/react";
import { useState } from "react";

import { Evoucher } from "@/types/evoucher";
import { EvoucherData } from "@/types/chat";
import { Sponsors } from "@/types/sponsors";
import { useEvoucher } from "@/hooks/useEvoucher";
import { useSponsors } from "@/hooks/useSponsors";
import { apiGolangRequest } from "@/utils/api";

export function useEvoucherSend(roomId: string | null) {
    const { evouchers } = useEvoucher();
    const { fetchSponsorById } = useSponsors();
    const [selectedEvoucher, setSelectedEvoucher] = useState<Evoucher | null>(null);
    const [evoucherData, setEvoucherData] = useState({
        message: {
            th: '',
            en: ''
        },
        claimUrl: '',
        sponsorImage: ''
    });
    const [sending, setSending] = useState(false);
    const canSendEvoucher = roomId && selectedEvoucher && evoucherData.message.th && evoucherData.message.en;

    const isEvoucherExpired = (evoucher: Evoucher): boolean => {
        const endDate = evoucher.endAt;
        if (!endDate) return false;
        return new Date(endDate) < new Date();
    };

    const sendEvoucher = async (evoucherData: EvoucherData) => {
        setSending(true);
        try {
            const res = await apiGolangRequest <{data: EvoucherData}>(
                "/evouchers/send",
                "POST",
                evoucherData
            );
            return res.data;
        } catch (err) {
            console.error("Send evoucher error:", err);
            throw new Error(err instanceof Error ? err.message : 'Failed to send evoucher.');
        } finally {
            setSending(false);
        }
    };

    const handleEvoucherSelect = async (evoucherId: string) => {
        const evoucher = evouchers.find(e => e._id === evoucherId);

        if (evoucher) {
            setSelectedEvoucher(evoucher);
            
            // Generate claim URL for nestjs api
            const claimURL = `${process.env.NEXT_PUBLIC_API_URL}/evouchers/${evoucher._id}/claim`;
            let sponsorImage = '';

            // Check if evoucher already has sponsor data populated
            if (evoucher.sponsor && typeof evoucher.sponsor === 'object' && evoucher.sponsor.logo?.logoPhoto) {
                sponsorImage = evoucher.sponsor.logo.logoPhoto;
            } else if (evoucher.sponsor && typeof evoucher.sponsor === 'string') {
                // If sponsor is just an ID, fetch sponsor info
                try {
                    const sponsorInfo = await fetchSponsorById(evoucher.sponsor);
                    
                    if (sponsorInfo && sponsorInfo.length > 0) {
                        const sponsorData = sponsorInfo[0] as unknown as Sponsors;
                        
                        if (sponsorData.logo?.logoPhoto) {
                            sponsorImage = sponsorData.logo.logoPhoto;
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch sponsor image:', error);
                }
            }
            
            setEvoucherData({
                message: {
                    th: evoucher.detail?.th || `รับส่วนลด ${evoucher.amount} บาท`,
                    en: evoucher.detail?.en || `Get ${evoucher.amount} THB discount`
                },
                claimUrl: claimURL,
                sponsorImage: sponsorImage
            });
        }
    };

    const handleEvoucherDataChange = (data: { 
        message: { th: string; en: string }; 
        claimUrl: string; 
        sponsorImage: string; 
    }) => {
        setEvoucherData(data);
    };

    const handleSendEvoucher = async () => {
        if (!selectedEvoucher || !roomId) {
            addToast({
                title: "Missing information",
                description: "Please select an evoucher",
                color: "warning",
            });
            return;
        }

        // Check if evoucher is expired
        if (isEvoucherExpired(selectedEvoucher)) {
            addToast({
                title: "Evoucher expired",
                description: "Cannot send expired evouchers. Please select a valid evoucher.",
                color: "danger",
            });
            return;
        }

        // Check if evoucher is not yet started
        const now = new Date();
        const startAt = selectedEvoucher.startAt ? new Date(selectedEvoucher.startAt) : null;

        if (startAt && now < startAt) {
            addToast({
                title: "Evoucher not started",
                description: "Cannot send evoucher before its start date.",
                color: "danger",
            });
            return;
        }

        try {
            const data: EvoucherData = {
                roomId: roomId,
                message: evoucherData.message,
                claimUrl: evoucherData.claimUrl,
                sponsorImage: evoucherData.sponsorImage
            };
            
            await sendEvoucher(data);
            
            addToast({
                title: "Evoucher sent successfully!",
                description: `Evoucher "${evoucherData.message.th}" has been sent to the room`,
                color: "success",
            });
            
            // Reset form
            setSelectedEvoucher(null);
            setEvoucherData({
                message: {
                    th: '',
                    en: ''
                },
                claimUrl: '',
                sponsorImage: ''
            });
        } catch (error) {
            addToast({
                title: "Error sending evoucher",
                description: error instanceof Error ? error.message : "Failed to send evoucher",
                color: "danger",
            });
        }
    };

    const refreshEvouchers = async () => {
        // This would trigger a re-fetch of evouchers from useEvoucher hook
        // The actual refresh logic is handled by useEvoucher hook
        window.location.reload();
    };

    return {
        // State
        evouchers,
        selectedEvoucher,
        evoucherData,
        sending,
        canSendEvoucher,

        // Actions
        handleEvoucherSelect,
        handleEvoucherDataChange,
        handleSendEvoucher,
        refreshEvouchers,
    };
}