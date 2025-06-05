import { useState, useEffect } from "react";
import { apiRequest } from "@/utils/api";
import { EvoucherType } from "@/types/evoucherType";

export function useEvoucherType() {
    const [evoucherType, setEvoucherType] = useState<EvoucherType[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch all evoucher type
    const fetchEvoucherType = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: EvoucherType[] }>("/evoucher-type?limit=0", "GET");
            setEvoucherType(Array.isArray(res.data?.data) ? res.data.data : []);
        } catch (err) {
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to fetch evoucher type.'
                    : 'Failed to fetch evoucher type.',
            );
        } finally {
            setLoading(false);
        }
    };

    // Create evoucher type
    const createEvoucherType = async (evoucherData: Partial<EvoucherType>) => {
        try {
            setLoading(true);
            const res = await apiRequest<EvoucherType>("/evoucher-type", "POST", evoucherData);
            console.log("Create response: ", res);

            if (res.data) {
                await new Promise((resolve) => {
                    setEvoucherType((prev) => {
                        const updated = [...prev, res.data as EvoucherType];
                        resolve(updated);
                        return updated;
                    });
                });
            }
        } catch (err) {
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to create evoucher type.'
                    : 'Failed to create evoucher type.',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvoucherType();
    }, [])

    return {
        evoucherType,
        loading,
        error,
        fetchEvoucherType,
        createEvoucherType,
    }
};