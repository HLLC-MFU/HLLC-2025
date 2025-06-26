import { useState, useEffect } from "react";
import { apiRequest, ApiResponse } from "@/utils/api";
import { Evoucher } from "@/types/evoucher";


export function useEvoucher() {
    const [evouchers, setEvouchers] = useState<Evoucher[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch all evouchers
    const fetchEvouchers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: Evoucher[] }>("/evoucher?limit=0", "GET");
            setEvouchers(Array.isArray(res.data?.data) ? res.data.data : []);
            return res;
        } catch (err) {
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to fetch evouchers.'
                    : 'Failed to fetch evouchers.',
            );
        } finally {
            setLoading(false);
        }
    };

    // Create evoucher code
    const createEvoucher = async (evoucherData: FormData) => {
        try {
            setLoading(true);
            const res = await apiRequest<{ data: Evoucher }>("/evoucher", "POST", evoucherData);
            const newEvoucher = res.data?.data;
            if (newEvoucher) {
                setEvouchers(prev => [...prev, newEvoucher]);
            }
            return res;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create evoucher.';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Update evoucher code
    const updateEvoucher = async (evoucherId: string, evoucherData: FormData) => {
        try {
            setLoading(true);
            const res = await apiRequest<{ data: Evoucher }>(`/evoucher/${evoucherId}`, "PATCH", evoucherData);
            const updatedEvoucher = res.data?.data;
            if (updatedEvoucher) {
                setEvouchers(prev =>
                    prev.map(evoucher =>
                        evoucher._id === evoucherId ? updatedEvoucher : evoucher
                    )
                );
            }
            return res;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update evoucher.';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Delete evoucher code
    const deleteEvoucher = async (evoucherId: string): Promise<ApiResponse<{ data: Evoucher }>> => {
        setLoading(true);
        try {
            const res = await apiRequest<{ data: Evoucher }>(`/evoucher/${evoucherId}`, "DELETE");
            const deletedEvoucher = res.data?.data;
            if (deletedEvoucher) {
                setEvouchers(prev => prev.filter(evoucher => evoucher._id !== evoucherId));
            }
            return res;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete evoucher.';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvouchers();
    }, []);

    return {
        evouchers,
        loading,
        error,
        fetchEvouchers,
        createEvoucher,
        updateEvoucher,
        deleteEvoucher,
    }
}