import { useState, useEffect, useRef } from "react";
import { apiRequest, ApiResponse } from "@/utils/api";
import { Evoucher } from "@/types/evoucher";

export function useEvoucher() {
    const [evouchers, setEvouchers] = useState<Evoucher[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const hasFetched = useRef(false);

    // Fetch all evouchers
    const fetchEvouchers = async (force = false) => {
        // Prevent multiple fetches unless forced
        if (hasFetched.current && !force) {
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: Evoucher[] }>("/evouchers?limit=0", "GET");
            
            console.log("API Response:", res);
            console.log("Response data:", res.data);
            
            // Handle the actual API response structure
            if (res.data && Array.isArray(res.data)) {
                console.log("Setting evouchers from res.data (array)");
                setEvouchers(res.data);
            } else if (res.data && Array.isArray(res.data.data)) {
                console.log("Setting evouchers from res.data.data (array)");
                setEvouchers(res.data.data);
            } else {
                console.log("Setting empty evouchers array");
                setEvouchers([]);
            }
            
            hasFetched.current = true;
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
            const newEvoucher = res.data?.data || res.data;
            if (newEvoucher && typeof newEvoucher === 'object' && '_id' in newEvoucher) {
                setEvouchers(prev => [...prev, newEvoucher as Evoucher]);
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
            const updatedEvoucher = res.data?.data || res.data;
            if (updatedEvoucher && typeof updatedEvoucher === 'object' && '_id' in updatedEvoucher) {
                setEvouchers(prev =>
                    prev.map(evoucher =>
                        evoucher._id === evoucherId ? updatedEvoucher as Evoucher : evoucher
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
            const deletedEvoucher = res.data?.data || res.data;
            if (deletedEvoucher && typeof deletedEvoucher === 'object' && '_id' in deletedEvoucher) {
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

    // Refresh evouchers (force fetch)
    const refreshEvouchers = async () => {
        return await fetchEvouchers(true);
    };

    useEffect(() => {
        fetchEvouchers();
    }, []);

    return {
        evouchers,
        loading,
        error,
        refreshEvouchers,
        createEvoucher,
        updateEvoucher,
        deleteEvoucher,
    }
}