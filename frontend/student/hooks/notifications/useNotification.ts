import { useEffect, useState } from "react";
import { NotificationItem } from "@/types/notification";
import { useApi } from "@/hooks/useApi";
import useProfile from "../useProfile";


export function useNotification() {
  const { data, loading, error, request } = useApi<NotificationItem[]>();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const { user } = useProfile();
  
  useEffect(() => {
    const fetchNotifications = async () => {
      const res = await request(`/users/${user?.data[0]._id}/notifications`, "GET");
      if (res) {
        // Sort notifications by timestamp in descending order (newest first)
        const sortedByTimestamp = [...res].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        // Separate unread and read notifications
        const unread = sortedByTimestamp.filter((n) => !n.read);
        const read = sortedByTimestamp.filter((n) => n.read);

        // Combine them, with unread appearing before read
        setNotifications([...unread, ...read]);
      }
    };

    fetchNotifications();
  }, [request, user?.data[0]._id]); // Add request and user?.id to the dependency array

  return { notifications, loading, error };
}