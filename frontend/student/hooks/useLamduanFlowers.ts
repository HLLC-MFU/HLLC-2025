import { LamduanFlower, LamduanSetting } from "@/types/lamduan-flowers";
import { apiRequest } from "@/utils/api";
import { useEffect, useState } from "react";

export function useLamduanFlowers() {
    const [flowers, setFlowers] = useState<LamduanFlower[]>([]);
     const [lamduanSetting, setLamduanSetting] = useState<LamduanSetting[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchLamduanSetting = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: LamduanSetting[] }>("/lamduan-setting?limit=0", "GET");

            setLamduanSetting(Array.isArray(res.data?.data) ? res.data.data : []);
            return res;
        } catch (err) {
            setError(
                err && typeof err === 'object' && 'message' in err
                    ? (err as { message?: string }).message || 'Failed to fetch lamduan setting.'
                    : 'Failed to fetch lamduan setting.',
            );
        } finally {
            setLoading(false);
        }
    };

    const createLamduanFlowers = async (flowersData: FormData) => {
        try {
            setLoading(true);

            const res = await apiRequest<LamduanFlower>('/lamduan-flowers', 'POST', flowersData);

            if (res.data) {
                setFlowers((prev) => [...prev, res.data as LamduanFlower]);
            }
            return res;
        } catch (err: any) {
            setError(err.message || 'Failed to create lamduan flowers.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLamduanSetting();
    }, []);

    return {
        flowers,
        lamduanSetting,
        loading,
        error,
        fetchLamduanSetting,
        createLamduanFlowers,
    };

}