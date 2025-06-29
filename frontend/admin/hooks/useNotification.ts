import { useState, useEffect } from "react"
import { Notification } from "@/types/notification"
import { apiRequest } from "@/utils/api"
import { addToast } from "@heroui/react";

export function useNotification() {
	const [notification, setNotification] = useState<Notification[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const fetchNotification = async () => {
		setLoading(true);
		setError(null);

		try {
			const res = await apiRequest<{ data: Notification[] }>("/notifications", "GET");
			setNotification(Array.isArray(res.data?.data) ? res.data.data : []);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to fetch notifications.');
			addToast({
				title: 'Failed to fetch notifications',
				description: error,
				color: 'danger',
			});
		} finally {
			setLoading(false);
		}
	};

	const createNotification = async (NotificationData: FormData) => {
		try {
			setLoading(true);
			const res = await apiRequest<{ data: Notification }>(`/notifications`, 'POST', NotificationData );
			
			if(res.statusCode !== 201) {
				throw new Error(res.message || 'Failed to create notification.');
			}

			addToast({
				title: 'Sent Notification Successful',
				color: 'success',
			});

		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to create notification.');
			addToast({
				title: 'Failed to create notification',
				description: error,
				color: 'danger',
			});
		} finally {
			setLoading(false);
		}
	};

	const deleteNotification = async (id: string): Promise<void> => {
		try {
			setLoading(true);

			const res = await apiRequest(`/notifications/${id}` , 'DELETE' );

			if (res.statusCode !== 200) {
				throw new Error(res.message || 'Failed to delete notification.');
			}

			setNotification((prev) => prev.filter((a) => a._id !== id));

			addToast({
				title: 'Notification deleted successfully!',
				color: 'success',
			});

		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to delete notification.');
			addToast({
				title: 'Failed to delete notification',
				description: error,
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
		notification,
		loading,
		error,
		deleteNotification,
		fetchNotification,
		createNotification,
	};
}