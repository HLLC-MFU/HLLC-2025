import { useState, useEffect } from "react"
import { Notification } from "@/types/notification"
import { apiRequest } from "@/utils/api"
import { addToast } from "@heroui/react";


export function useNotification() {
    const [notifications, setNotification] = useState<Notification[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // 📥 Fetch all Student
    const fetchNotification = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiRequest<{ data: Notification[] }>("/notifications", "GET");
            setNotification(Array.isArray(res.data?.data) ? res.data.data : []);
        } catch (err: any) {
            setError(err.message || "Failed to fetch notifications.");
        } finally {
            setLoading(false);
        }
    };

    // ➕ Create new Notification
    const createNotification = async (NotificationData: FormData) => {

        try {
            setLoading(true);
            const res = await apiRequest<{ data: Notification }>(`/notifications`, 'POST', NotificationData );
            const data = await res.data?.data;
            console.log("Create response:", res, data);
            if (data && '_id' in data) {
                setNotification((prev) => [...prev, data]);
            }
            return res;
        } catch (err: any) {
            setError(err.message || "Failed to create notifications.");
        } finally {
            setLoading(false);
        }
    };

    const deleteNotification = async (id: string): Promise<void> => {
        try {
            setLoading(true);

            const res = await apiRequest(`/notifications/${id}` , 'DELETE' );

            console.log('Delete response:', res);

            if (res.statusCode === 200 || res.statusCode === 204) {
                setNotification((prev) => prev.filter((a) => a._id !== id));
                addToast({
                    title: 'Notification deleted successfully!',
                    color: 'success',
                });
                fetchNotification();
            } else {
                throw new Error(res.message || 'Failed to delete s.');
            }
        } catch (err: any) {
            console.error('Error s activity:', err);
            const errorMessage = err.message || 'Failed to delete s.';
            setError(errorMessage);
            addToast({
                title: 'Failed to delete s',
                description: errorMessage,
                color: 'danger',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotification();
    }, []);

    return {
        notifications,
        loading,
        error,
        deleteNotification,
        fetchNotification,
        createNotification,
    };

}