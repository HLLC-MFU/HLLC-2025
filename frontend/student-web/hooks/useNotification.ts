"use client"
import { useEffect, useState } from "react";
import { useProfile } from "./useProfile";
import { apiRequest } from "@/utils/api";
import { addToast } from "@heroui/react";
import { NotificationItem } from "@/types/notification";

export function useNotification() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchNotification = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await apiRequest<NotificationItem[]>("/notifications/me", "GET");
            setNotifications(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch notifications.");
            addToast({ title: "Failed to fetch notifications", description: error, color: "danger" });
        } finally {
            setLoading(false);
        }
    };

    const readNotification = async (id: string) => {
        try {
            const res = await apiRequest<{ success: boolean }>(`/notifications/${id}/read`, "POST" );

            if (res.data?.success) {
                await fetchNotification();
            } else {
                throw new Error("Mark as read failed");
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to mark as read.";
            setError(message);
        }
    };

    useEffect(() => {
        fetchNotification();
    }, []);

    return {
        notifications,
        loading,
        error,
        fetchNotification,
        readNotification,
        setNotifications, 
    };
}
