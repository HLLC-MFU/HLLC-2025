'use client';

import { useSseStore } from '@/stores/useSseStore';

export function useNotification() {
  const notifications = useSseStore(state => state.notifications);
  const fetchNotification = useSseStore(state => state.fetchNotification);
  const readNotification = useSseStore(state => state.readNotification);
  const markAllAsRead = useSseStore(state => state.markAllAsRead);

  return {
    notifications,
    loading: false,
    error: null,
    fetchNotification,
    readNotification,
    markAllAsRead,
    setNotifications: () => {},
  };
}
