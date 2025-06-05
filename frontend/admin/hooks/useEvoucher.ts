import { apiRequest } from "@/utils/api";
import { useState, useEffect } from "react";

export function useEvoucher() {
    const [evouchers, setEvouchers] = useState<[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch all evouchers
    const fetchEvouchers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: [] }>("/evoucher?limit=0", "GET");
            setEvouchers(Array.isArray(res.data?.data) ? res.data.data : []);
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

    // // Create evoucher
    // const createEvoucher = async (evoucherData: Partial<>) => {
    //     try {
    //         setLoading(true);
    //         const res = await apiRequest<>("/evoucher", "POST", evoucherData);
    //         console.log("Create response: ", res);

    //         if (res.data) {
    //             await new Promise((resolve) => {
    //                 setEvouchers((prev) => {
    //                     const updated = [...prev, res.data as ];
    //                     resolve(updated);
    //                     return updated;
    //                 });
    //             });
    //         }
    //     } catch (err) {
    //         setError(
    //             err && typeof err === 'object' && 'message' in err
    //                 ? (err as { message?: string }).message || 'Failed to create evouchers.'
    //                 : 'Failed to create evouchers.',
    //         );
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    useEffect(() => {
        fetchEvouchers();
    }, []);

    return {
        evouchers,
        loading,
        error,
        fetchEvouchers,
    }
}