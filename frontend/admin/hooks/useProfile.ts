import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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
  createdAt: string;
  updatedAt: string;
};

interface ProfileStore {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
}

export const useProfile = create<ProfileStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: "profile-store", // 🗂️ localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);
