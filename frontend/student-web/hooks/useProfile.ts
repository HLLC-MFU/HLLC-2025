import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { Major } from '@/types/major';
import { apiRequest } from '@/utils/api';

export type Role = {
  _id: string;
  name: string;
  permissions: string[];
};

export type User = {
  _id: string;
  name: {
    first: string;
    middle?: string;
    last: string;
  };
  username: string;
  role: Role;
  metadata?: {
    major?: Major;
  };
  createdAt: string;
  updatedAt: string;
};

interface ProfileStore {
  user: User | null;
  majorName: string | null;
  schoolName: string | null;
  schoolAcronym: string | null;
  loading: boolean;
  error: string | null;
  fetchUser: () => Promise<void>;
  clearUser: () => void;
  setUser: (user: User) => void;
  _fetched: boolean; // internal flag
}

export const useProfile = create<ProfileStore>()(
  persist(
    (set, get) => ({
      user: null,
      majorName: null,
      schoolName: null,
      schoolAcronym: null,
      loading: false,
      error: null,
      _fetched: false,

      fetchUser: async () => {
        if (get()._fetched) return; // ไม่โหลดซ้ำ
        set({ loading: true, error: null });

        try {
          const res = await apiRequest<{ data: User[]; message: string }>(
            '/users/profile',
            'GET',
          );

          if (res.statusCode !== 200)
            throw new Error('Failed to fetch profile');

          const data = res?.data?.data?.[0];

          if (!data) throw new Error('User not found');

          const majorName = data.metadata?.major?.name?.en ?? null;
          const schoolName = data.metadata?.major?.school?.name?.en ?? null;
          const schoolAcronym = data.metadata?.major?.school?.acronym ?? null;

          set({
            user: data,
            majorName,
            schoolName,
            schoolAcronym,
            _fetched: true,
          });
        } catch (err) {
          set({
            user: null,
            majorName: null,
            schoolName: null,
            schoolAcronym: null,
            error:
              err && typeof err === 'object' && 'message' in err
                ? (err as { message?: string }).message ||
                  'Failed to fetch user.'
                : 'Failed to fetch user.',
          });
        } finally {
          set({ loading: false });
        }
      },

      clearUser: () =>
        set({
          user: null,
          majorName: null,
          schoolName: null,
          schoolAcronym: null,
          error: null,
          _fetched: false,
        }),
        setUser: (user: User) => set({ user }),
    }),
    {
      name: 'profile-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
