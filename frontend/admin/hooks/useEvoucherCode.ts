import { useState, useEffect } from "react";
import { apiRequest, ApiResponse } from "@/utils/api";
import { EvoucherCode } from "@/types/evoucher-code";

export function useEvoucherCode() {
    const [evoucherCodes, setEvoucherCodes] = useState<EvoucherCode[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch all evoucher codes
    const fetchEvoucherCodes = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: EvoucherCode[] }>("/evoucher-codes?limit=0", "GET");
            const evoucherCodeData = res.data?.data ?? [];
            setEvoucherCodes(evoucherCodeData);
            return res;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch evoucher codes.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Create evoucher code
    const createEvoucherCode = async (evoucherCodeData: FormData): Promise<ApiResponse<{ data: EvoucherCode }>> => {
        setLoading(true);
        try {
            const res = await apiRequest<{ data: EvoucherCode }>("/evoucher-codes", "POST", evoucherCodeData);
            const newEvoucherCode = res.data?.data;
            if (newEvoucherCode) {
                setEvoucherCodes(prev => [...prev, newEvoucherCode]);
            }
            return res;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create evoucher code.';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Update evoucher code
    const updateEvoucherCode = async (evoucherCodeId: string, evoucherCodeData: FormData): Promise<ApiResponse<{ data: EvoucherCode }>> => {
        setLoading(true);
        try {
            const res = await apiRequest<{ data: EvoucherCode }>(`/evoucher-codes/${evoucherCodeId}`, "PATCH", evoucherCodeData);
            const updatedEvoucherCode = res.data?.data;
            if (updatedEvoucherCode) {
                setEvoucherCodes(prev => 
                    prev.map(evoucherCode => 
                        evoucherCode._id === evoucherCodeId ? updatedEvoucherCode : evoucherCode
                    )
                );
            }
            return res;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update evoucher code.';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Delete evoucher code
    const deleteEvoucherCode = async (evoucherCodeId: string): Promise<ApiResponse<{ data: EvoucherCode }>> => {
        setLoading(true);
        try {
            const res = await apiRequest<{ data: EvoucherCode }>(`/evoucher-codes/${evoucherCodeId}`, "DELETE");
            const deletedEvoucherCode = res.data?.data;
            if (deletedEvoucherCode) {
                setEvoucherCodes(prev => prev.filter(evoucherCode => evoucherCode._id !== evoucherCodeId));
            }
            return res;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete evoucher code.';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvoucherCodes();
    }, []);

    return {
        evoucherCodes,
        loading,
        error,
        createEvoucherCode,
        updateEvoucherCode,
        deleteEvoucherCode,
    };
}