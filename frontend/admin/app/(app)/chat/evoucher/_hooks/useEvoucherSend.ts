"use client";

import { useState, useEffect } from "react";
import { useEvoucher } from "@/hooks/useEvoucher";
import { EvoucherData, EvoucherResponse } from "@/types/chat";
import { Evoucher } from "@/types/evoucher";
import { addToast } from "@heroui/react";
import { chatApiRequest } from "@/hooks/useChat";

const CHAT_API_BASE_URL = process.env.GO_PUBLIC_API_URL || "http://localhost:1334/api";

export function useEvoucherSend(roomId: string | null) {
    const [loading, setLoading] = useState(false);
    const { evouchers, refreshEvouchers, loading: evoucherLoading, error: evoucherError } = useEvoucher();

    const [selectedEvoucher, setSelectedEvoucher] = useState<Evoucher | null>(null);
    const [evoucherData, setEvoucherData] = useState({
        title: '',
        description: '',
        claimURL: ''
    });

    useEffect(() => {
        refreshEvouchers();
    }, []);

    // Debug: Log evouchers data
    useEffect(() => {
        console.log("Evouchers data:", evouchers);
        console.log("Evouchers length:", evouchers.length);
    }, [evouchers]);

    const sendEvoucher = async (evoucherData: EvoucherData): Promise<EvoucherResponse> => {
        try {
            setLoading(true);
            const res = await chatApiRequest<EvoucherResponse>("/evouchers/send", "POST", evoucherData);
            
            if (res.statusCode !== 200 && res.statusCode !== 201) {
                throw new Error(res.message || `HTTP ${res.statusCode}: Failed to send evoucher`);
            }

            return res.data as EvoucherResponse;
        } catch (err) {
            console.error("Send evoucher error:", err);
            throw new Error(err instanceof Error ? err.message : 'Failed to send evoucher.');
        } finally {
            setLoading(false);
        }
    };

    const handleEvoucherSelect = (evoucherId: string) => {
        const evoucher = evouchers.find(e => e._id === evoucherId);
        if (evoucher) {
            setSelectedEvoucher(evoucher);
            
            // Auto-generate ClaimURL with the selected evoucher ID
            const claimURL = `${CHAT_API_BASE_URL}/api/${evoucher._id}/claim`;
            
            setEvoucherData({
                title: evoucher.acronym,
                description: evoucher.detail?.th || evoucher.detail?.en || `Get ${evoucher.amount} THB off`,
                claimURL: claimURL
            });
        }
    };

    const handleEvoucherDataChange = (data: { title: string; description: string; claimURL: string }) => {
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
                title: evoucherData.title,
                ClaimURL: evoucherData.claimURL,
                description: evoucherData.description
            };
            
            await sendEvoucher(data);
            
            addToast({
                title: "Evoucher sent successfully!",
                description: `Evoucher "${evoucherData.title}" has been sent to the room`,
                color: "success",
            });
            
            // Reset form
            setSelectedEvoucher(null);
            setEvoucherData({
                title: '',
                description: '',
                claimURL: ''
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

    const canSendEvoucher = selectedEvoucher && roomId && isEvoucherValid(selectedEvoucher);

    return {
        // State
        evouchers,
        selectedEvoucher,
        evoucherData,
        loading: evoucherLoading,
        error: evoucherError,
        sending: loading,
        canSendEvoucher,

        // Actions
        handleEvoucherSelect,
        handleEvoucherDataChange,
        handleSendEvoucher,
        refreshEvouchers,
    };
} 