import { apiRequest } from "@/utils/api"
import { addToast } from "@heroui/react"
import { useEffect, useState } from "react"

export function useNotification() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchNotification = async () => {
        setLoading(true)
        setError(null)

        try {
            const res = await apiRequest<{ data: Notification[] }>("/notifications/me", "GET")
            setNotifications(Array.isArray(res.data?.data) ? res.data.data : [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch notifications.')
            addToast({
                title: 'Failed to fetch notifications',
                description: error,
                color: 'danger',
            })
        } finally {
            setLoading(false)
        }
    }

    const readNotifications = async () => {
        setLoading(true)
        setError(null)

        try {
            const res = await apiRequest<{ success: boolean }>("/notifications/read", "POST")

            if (res.data?.success) {
                setNotifications(prev =>
                    prev.map(noti => ({ ...noti, isRead: true }))
                )

                addToast({
                    title: 'Marked all as read',
                    description: 'All your notifications are now marked as read.',
                    color: 'success',
                })
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to mark as read.')
            addToast({
                title: 'Error',
                description: error,
                color: 'danger',
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchNotification();
    }, []);

    return {
        notifications,
        loading,
        error,
        fetchNotification,
        readNotifications,
    };
}
