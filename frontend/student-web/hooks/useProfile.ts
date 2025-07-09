import { Major } from "@/types/major";
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
  setUser: (user: User) => void;
  clearUser: () => void;
}


export const useProfile = create<ProfileStore>()(
  persist(
    (set) => ({
      user: null,
      majorName: null,
      schoolName: null,
      setUser: (user) => {
        const majorName = user.metadata?.major?.name?.en ?? null;
        const schoolName = user.metadata?.major?.school?.name?.en ?? null;
        set({ user, majorName, schoolName });
      },
      clearUser: () => set({ user: null, majorName: null, schoolName: null }),
    }),
    {
      name: "profile-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);