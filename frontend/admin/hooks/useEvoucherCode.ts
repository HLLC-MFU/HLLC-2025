import { useState, useEffect } from "react";
import { apiRequest } from "@/utils/api";
import { EvoucherCode } from "@/types/evoucher-code";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export function useEvoucherCode() {
    const [evoucherCodes, setEvoucherCodes] = useState<EvoucherCode[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch all evouchers
    const fetchEvoucherCodes = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: EvoucherCode[] }>("/evoucher-code?limit=0", "GET");

            setEvoucherCodes(Array.isArray(res.data?.data) ? res.data.data : []);
            return res;
        } catch (err) {
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to fetch evoucher codes.'
                    : 'Failed to fetch evoucher codes.',
            );
        } finally {
            setLoading(false);
        }
    };

    // Create evoucher
    const createEvoucherCode = async (evoucherCodeData: FormData) => {
        try {
            setLoading(true);

            const res = await fetch(`${API_BASE_URL}/evoucher-code`, {
                method: "POST",
                body: evoucherCodeData,
                credentials: "include"
            });
            const data = await res.json();
            console.log("Create response:", res, data);

            if (data && '_id' in data) {
                setEvoucherCodes((prev) => [...prev, data]);
            }

            return res;
        } catch (err) {
            const message =
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to create evoucher codes.'
                    : 'Failed to create evoucher codes.';
            setError(message);
            throw new Error(message);
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
        fetchEvoucherCodes,
        createEvoucherCode,
    }
}