import { useState, useEffect } from "react";
import { Checkin, CheckinCreate } from "@/types/checkin";
import { apiRequest } from "@/utils/api";

export function useCheckin() {
    const [checkin, setCheckin] = useState<Checkin[]>([]);
    const [checkinCreate, setCheckinCreate] = useState<CheckinCreate | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchcheckin = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: Checkin[] }>("/checkin?limit=0", "GET");
            setCheckin(Array.isArray(res.data?.data) ? res.data.data : []);
        } catch (err: any) {
            setError(err.message || "Failed to fetch checkin data.");
        } finally {
            setLoading(false);
        }
    };

    const createcheckin = async (checkinData: Partial<CheckinCreate>) => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: Checkin }>("/checkin", "POST", checkinData);
            if (res.data) {
                setCheckin((prev) => [...prev, res.data]);
            }
        } catch (err: any) {
            setError(err.message || "Failed to create checkin.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchcheckin();
    }, []);

    return {
        checkin,
        checkinCreate,
        loading,
        error,
        fetchcheckin,
        createcheckin,
    };
}
