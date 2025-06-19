// stores/useProfile.ts
import { create } from "zustand";
import { apiRequest } from "@/utils/api";
import { User, UserData } from "../types/user";

interface ProfileStore {
  user: User | null;
  setUser: (user: User | null) => void;
  getProfile: () => Promise<User | null>;
  clearProfile: () => void;
}

const useProfile = create<ProfileStore>((set) => ({
  user: null,

  setUser: (user) => set({ user }),

  getProfile: async () => {
    try {
      const res = await apiRequest<User>("/users/profile");
      if (res.statusCode === 200 && res.data) {
        set({ user: res.data });
        console.log("✅ Profile fetched successfully", res.data.data[0].name);
        return res.data;
      } else {
        return null;
      }
    } catch (err) {
      console.error("❌ Failed to fetch profile", err);
      return null;
    }
  },

  clearProfile: () => set({ user: null }),
}));


export default useProfile;
