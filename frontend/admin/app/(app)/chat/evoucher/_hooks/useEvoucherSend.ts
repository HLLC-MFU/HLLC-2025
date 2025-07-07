"use client";

import { Evoucher } from "@/types/evoucher";
import { EvoucherData } from "@/types/chat";
import { useEvoucher } from "@/hooks/useEvoucher";
import { useSponsors } from "@/hooks/useSponsors";
import { addToast } from "@heroui/react";
import { useState, useEffect } from "react";
import { useGolangApi } from "@/hooks/useApi";

export function useEvoucherSend(roomId: string | null) {
    const { request } = useGolangApi();
    const { evouchers, refreshEvouchers } = useEvoucher();
    const { fetchEvoucherCodeBySponsorId } = useSponsors();
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

    useEffect(() => {
        refreshEvouchers();
    }, []);

    // Debug: Log evouchers data
    useEffect(() => {
        console.log("Evouchers data:", evouchers);
        console.log("Evouchers length:", evouchers.length);
    }, [evouchers]);

    const sendEvoucher = async (evoucherData: EvoucherData): Promise<any> => { // Changed EvoucherResponse to any as EvoucherResponse is not defined
        try {
            setSending(true);
            const res = await request<any>("/evouchers/send", "POST", evoucherData); // Changed EvoucherResponse to any
        
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
            
            // Auto-generate claim URL with the correct format for NestJS API
            const claimURL = `http://localhost:8080/api/evouchers/${evoucher._id}/claim`;
            
            // Fetch sponsor image using sponsorId from evoucher
            let sponsorImage = '';
            if (evoucher.sponsor) {
                try {
                    console.log('Fetching sponsor image for sponsorId:', evoucher.sponsor);
                    const sponsorInfo = await fetchEvoucherCodeBySponsorId(evoucher.sponsor);
                    console.log('Sponsor info response:', sponsorInfo);
                    
                    if (sponsorInfo.length > 0) {
                        const sponsor = sponsorInfo[0];
                        console.log('Sponsor object:', sponsor);
                        
                        // Try to get logo from different possible locations
                        if (sponsor.logo) {
                            // Direct logo field (new format)
                            sponsorImage = sponsor.logo;
                            console.log('Found direct logo:', sponsorImage);
                        } else if (sponsor.photo?.logo) {
                            // Nested photo.logo field
                            sponsorImage = sponsor.photo.logo;
                            console.log('Found photo.logo:', sponsorImage);
                        } else if (sponsor.photo?.logoPhoto) {
                            // Extract filename from URL
                            const logoUrl = sponsor.photo.logoPhoto;
                            const filename = logoUrl.split('/').pop() || '';
                            sponsorImage = filename;
                            console.log('Found logoPhoto, extracted filename:', sponsorImage);
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

        // Check if evoucher has reached max claims
        if (selectedEvoucher.claims && selectedEvoucher.claims.currentClaim >= selectedEvoucher.claims.maxClaim) {
            addToast({
                title: "Evoucher fully claimed",
                description: "This evoucher has reached its maximum claim limit.",
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
            
            console.log('Sending evoucher data:', data);
            
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

    const isEvoucherExpired = (evoucher: Evoucher): boolean => {
        const endDate = evoucher.endAt || evoucher.expiration;
        if (!endDate) return false;
        return new Date(endDate) < new Date();
    };

    const isEvoucherValid = (evoucher: Evoucher | null): boolean => {
        if (!evoucher) return false;
        if (isEvoucherExpired(evoucher)) return false;
        // Check if evoucher is within valid date range
        const now = new Date();
        const startAt = evoucher.startAt ? new Date(evoucher.startAt) : null;
        const endAt = evoucher.endAt ? new Date(evoucher.endAt) : (evoucher.expiration ? new Date(evoucher.expiration) : null);
        if (startAt && now < startAt) return false;
        if (endAt && now > endAt) return false;
        // Check claims if available
        if (evoucher.claims && evoucher.claims.currentClaim >= evoucher.claims.maxClaim) return false;
        return true;
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