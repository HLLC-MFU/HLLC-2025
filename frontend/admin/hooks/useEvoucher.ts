import { useState, useEffect } from "react";
import { apiRequest } from "@/utils/api";
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

    // Create evoucher
    const createEvoucher = async (evoucherData: FormData) => {
        try {
            setLoading(true);
            const res = await apiRequest<Evoucher>(`/evoucher`, "POST", evoucherData);

            if (res.data) {
                await new Promise((resolve) => {
                    setEvouchers((prev) => {
                        const updated =[...prev, res.data as Evoucher];

                        resolve(updated);

                        return updated;
                    });
                })
            }

            return res;
        } catch (err) {
            const message =
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to create evouchers.'
                    : 'Failed to create evouchers.';
            setError(message);
            throw new Error(message);
        } finally {
            setLoading(false);
        }
    };

    // Update Evoucher
    const updateEvoucher = async (id: string, evoucherData: FormData) => {
        try {
            setLoading(true);
            const res = await apiRequest<Evoucher>(`/evoucher/${id}`, "PATCH", evoucherData)

            if (res.data) {
                setEvouchers((prev) => prev.map((e) => (e._id === id ? res.data! : e)));
            }

            return res;
        } catch (err) {
            const message =
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to update evouchers.'
                    : 'Failed to update evouchers.';
            setError(message);
            throw new Error(message);
        } finally {
            setLoading(false);
        }
    };

    // Delete Evoucher
    const deleteEvoucher = async (id: string) => {
        try {
            setLoading(true);
            const res = await apiRequest<Evoucher>(`/evoucher/${id}`, "DELETE")

            if (res.statusCode !== 200) {
                throw new Error(res.message || "Failed to delete user.");
            } else {
                setEvouchers((prev) => prev.filter((e) => e._id !== id))
            }

            return res;
        } catch (err) {
            const message =
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to delete evouchers.'
                    : 'Failed to delete evouchers.';
            setError(message);
            throw new Error(message);
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