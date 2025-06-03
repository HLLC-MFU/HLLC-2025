import { useState, useEffect } from "react"
import { Student, Notification } from "@/types/student"
import { apiRequest } from "@/utils/api"

export function useNotification() {
    const [notification, setNotification] = useState<Notification[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // 📥 Fetch all Student
    const fetchnoti = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: Notification[] }>("/notifications", "GET");
            setNotification(Array.isArray(res.data?.data) ? res.data.data : []);
        } catch (err: any) {
            setError(err.message || "Failed to fetch schools.");
        } finally {
            setLoading(false);
        }
    };

    // ➕ Create new Notification
    const createNotification = async (NotificationData: Partial<Notification>) => {
        try {
            setLoading(true);
            const res = await apiRequest<Notification>("/notifications", "POST", NotificationData);
            console.log("Create response:", res);

            if (res.data) {
                await new Promise((resolve) => {
                    setNotification((prev) => {
                        const updated = [...prev, res.data as Notification];
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
        fetchnoti();
    }, []);

    return {
        notification,
        loading,
        error,
        fetchnoti,
        createNotification,
    };

}