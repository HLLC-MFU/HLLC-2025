import { create } from 'zustand';

import { apiRequest } from '@/utils/api';
import { Activities, Progress } from '@/types/activities';
import { NotificationItem } from '@/types/notification';

type SseState = {
  activities: Activities[];
  notifications: NotificationItem[];
  connected: boolean;
  progress: Progress;

  fetchActivitiesByUser: () => Promise<void>;
  fetchNotification: () => Promise<void>;
  readNotification: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<boolean>;
  setConnected: (connected: boolean) => void;
  addNotification: (notification: NotificationItem) => void;
  fetchUserProgress: () => Promise<void>;
};

export const useSseStore = create<SseState>((set, get) => ({
  activities: [],
  notifications: [],
  connected: false,
  progress: {
    userProgressCount: 0,
    progressPercentage: 0,
    scopedActivitiesCount: 0,
  },

  setConnected: connected => set({ connected }),

  fetchActivitiesByUser: async () => {
    try {
      const res = await apiRequest<{ data: Activities[] }>(
        '/activities/user',
        'GET',
      );

      set({ activities: res.data?.data ?? [] });
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    }
  },

  fetchNotification: async () => {
    try {
      const res = await apiRequest<NotificationItem[]>(
        '/notifications/me',
        'GET',
      );

      set({ notifications: Array.isArray(res.data) ? res.data : [] });
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  },

  fetchUserProgress: async () => {
    try {
      const res = await apiRequest<Progress>('/activities/progress', 'GET');

      const progress = res.data ?? {
        userProgressCount: 0,
        progressPercentage: 0,
        scopedActivitiesCount: 0,
      };

      set({ progress });
    } catch (err) {
      console.error('Failed to fetch user progress:', err);
    }
  },

  readNotification: async (id: string) => {
    try {
      const res = await apiRequest<{ success: boolean }>(
        `/notifications/${id}/read`,
        'POST',
      );

      if (res.statusCode === 200 || res.statusCode === 201) {
        await get().fetchNotification();
      } else {
        throw new Error('Failed to mark as read');
      }
    } catch (err) {
      console.error('Error reading notification:', err);
    }
  },


  markAllAsRead: async () => {
    try {
      const { notifications } = get();
      const unreadIds = notifications
        .filter(n => !n.isRead)
        .map(n => n._id);

      if (unreadIds.length === 0) {
        return true;
      }

      for (const id of unreadIds) {
        const res = await apiRequest(`/notifications/${id}/read`, 'POST');

        if (res.statusCode !== 200 && res.statusCode !== 201) {
          throw new Error('One or more notifications failed to mark as read');
        }
      }

      set((state) => ({
        notifications: state.notifications.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      }));

      return true;
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      return false;
    }
  },

  addNotification: notification =>
    set(state => ({
      notifications: [...state.notifications, notification],
    })),
}));
