import { EvoucherCodes } from "@/types/evouchers";
import { apiRequest } from "@/utils/api";
import { addToast } from "@heroui/react";
import { useEffect, useState } from "react";

export default function useEvouchers() {
    const [myEvoucherCodes, setMyEvoucherCodes] = useState<EvoucherCodes[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch my evoucher codes
    const fetchMyEvoucherCodes = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: EvoucherCodes[] }>('/evoucher-codes/my-code?limit=0', 'GET');

            if (res.data) {
                setMyEvoucherCodes(Array.isArray(res.data.data) ? res.data.data : []);
            }
            return res;
        } catch (err) {
            const errorMessage = err && typeof err === 'object' && 'message' in err
                ? (err as { message?: string }).message || 'Failed to fetch my evoucher codes.'
                : 'Failed to fetch my evoucher codes.';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Use evoucher code
    const usedEvoucherCodes = async (evoucherCodeId: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<EvoucherCodes>(`/evoucher-codes/${evoucherCodeId}/used`, 'POST');
            if (!res.data) return;

            if (res.data) {
                await new Promise(resolve => {
                    setMyEvoucherCodes(prev => {
                        const updated = [...prev, res.data as EvoucherCodes];

                        resolve(updated);
                        return updated;
                    });
                });
                addToast({
                    title: "Success",
                    description: "The e-voucher was used successfully.",
                    color: "success",
                    variant: "solid",
                    classNames: {
                        base: "text-white"
                    },
                })
            }

            return res;
        } catch (err) {
            const errorMessage = err && typeof err === 'object' && 'message' in err
                ? (err as { message?: string }).message || 'Failed to use evoucher code.'
                : 'Failed to use evoucher code.';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchMyEvoucherCodes();
    }, []);

    return {
        myEvoucherCodes,
        fetchMyEvoucherCodes,
        usedEvoucherCodes,
        loading,
        error,
    }
};