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

      if (res.data?.success) {
        await get().fetchNotification(); // Refresh state
      } else {
        throw new Error('Failed to mark as read');
      }
    } catch (err) {
      console.error('Error reading notification:', err);
    }
  },

  addNotification: notification =>
    set(state => ({
      notifications: [...state.notifications, notification],
    })),
}));
