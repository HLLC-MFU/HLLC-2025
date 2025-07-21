import { create } from 'zustand';
import { NotificationItem } from '@/types/notification';

interface NotificationState {
  notifications: NotificationItem[];
  setNotifications: (notifications: NotificationItem[]) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) =>
      n._id === id ? { ...n, isRead: true } : n
    ),
  })),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
  })),
})); 