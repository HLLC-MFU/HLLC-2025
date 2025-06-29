import { LamduanFlowers } from "@/types/lamduan-flowers";
import { apiRequest } from "@/utils/api";
import { addToast } from "@heroui/react";
import { useEffect, useState } from "react";

export function useLamduanFlowers() {
    const [lamduanFlowers, setLamduanFlowers] = useState<LamduanFlowers[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<String | null>(null);

    const fetchLamduanFlowers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: LamduanFlowers[] }>("/lamduan-flowers?limit=0", "GET");

            setLamduanFlowers(Array.isArray(res.data?.data) ? res.data.data : []);
            return res;
        } catch (err) {
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to fetch lamduan flowers.'
                    : 'Failed to fetch lamduan flowers.',
            );
        } finally {
            setLoading(false);
        }
    };

    const deleteLamduanFlowers = async (id: string): Promise<void> => {
        try {
            setLoading(true);
            const res = await apiRequest(`/lamduan-flowers/${id}`, 'DELETE');

            if (res.statusCode === 200) {
                setLamduanFlowers((prev) => prev.filter((s) => s._id !== id));
            } else {
              throw new Error(res.message || 'Failed to delete lamduan flowers.');
            }
        } catch (err: any) {
          setError(err.message || 'Failed to delete lamduan flowers.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLamduanFlowers();
    } , []);

    return {
        lamduanFlowers,
        loading,
        error,
        fetchLamduanFlowers,
        deleteLamduanFlowers,
    };
}