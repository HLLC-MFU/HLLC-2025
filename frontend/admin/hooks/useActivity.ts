
import { useState, useEffect } from "react";
import { apiRequest } from "@/utils/api";
import { Activities } from "@/types/activities";

export function useActivity() {
    const [activities, setActivities] = useState<Activities[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 📥 Fetch all activities
    const fetchActivities = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: Activities[] }>("/activities?limit=0", "GET");
            setActivities(Array.isArray(res.data?.data) ? res.data.data : []);
        } catch (err: any) {
            setError(err.message || "Failed to fetch activities.");
        } finally {
            setLoading(false);
        }
    };

    // ➕ Create new activity
    const createActivity = async (activityData: Partial<Activities>) => {
        try {
            setLoading(true);
            const res = await apiRequest<any>("/activities", "POST", activityData);
            console.log("Create response:", res);

            if (res.data) {
                await new Promise((resolve) => {
                    setActivities((prev) => {
                        const updated = [...prev, res.data];
                        resolve(updated);
                        return updated;
                    });
                });
            }
        } catch (err: any) {
            setError(err.message || "Failed to create activity.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities();
    }, []);

    return {
        activities,
        loading,
        error,
        fetchActivities,
        createActivity,
    };
}