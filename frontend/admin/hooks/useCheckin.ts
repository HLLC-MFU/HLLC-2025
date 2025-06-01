import { useState, useEffect } from "react";
import { checkin } from "@/types/checkin";
import { apiRequest } from "@/utils/api";

export function useCheckin() {
    const [checkin, setCheckin] = useState<checkin[]>([])
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 📥 Fetch all checkin
    const fetchcheckin = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: checkin[] }>("/checkin?limit=0", "GET");
            setCheckin(Array.isArray(res.data?.data) ? res.data.data : []);
        } catch (err: any) {
            setError(err.message || "Failed to fetch schools.");
        } finally {
            setLoading(false);
        }
    };

    // ➕ Create new checkin
    const createcheckin = async (checkinData: Partial<checkin>) => {
        try {
            setLoading(true);
            const res = await apiRequest<checkin>("/checkin", "POST", checkinData);
            console.log("Create response:", res);

            if (res.data) {
                await new Promise((resolve) => {
                    setCheckin((prev) => {
                        const updated = [...prev, res.data as checkin];
                        resolve(updated);
                        return updated;
                    });
                });
            }
        } catch (err: any) {
            setError(err.message || "Failed to create school.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchcheckin();
    }, []);

    return {
        checkin,
        loading,
        error,
        fetchcheckin,
        createcheckin
    }
}