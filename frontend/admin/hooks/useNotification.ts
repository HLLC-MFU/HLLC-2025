import { useState, useEffect } from "react"
import { Notification } from "@/types/Notification"
import { apiRequest } from "@/utils/api"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

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
    const createNotification = async (NotificationData: FormData) => {

        try {
            setLoading(true);

            const res = await fetch(`${API_BASE_URL}/notifications`, {
                method: "POST",
                body: NotificationData,
                credentials: "include"
            });
            const data = await res.json();
            console.log("Create response:", res, data);
            
            if (data && '_id' in data) {
                setNotification((prev) => [...prev, data]);
            }
            return res;
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