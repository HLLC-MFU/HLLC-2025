import { useState, useEffect } from "react";
import { apiRequest } from "@/utils/api";
import { Evoucher } from "@/types/evoucher";
// import { cookies } from 'next/headers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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
            // const token = (await cookies()).get('accessToken')?.value;

            const res = await fetch(`${API_BASE_URL}/evoucher`, {
                method: "POST",
                body: evoucherData,
                credentials: "include"
            });
            const data = await res.json();
            console.log("Create response:", res, data);

            if (data && '_id' in data) {
                setEvouchers((prev) => [...prev, data]);
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


    useEffect(() => {
        fetchEvouchers();
    }, []);

    return {
        evouchers,
        loading,
        error,
        fetchEvouchers,
        createEvoucher,
    }
}