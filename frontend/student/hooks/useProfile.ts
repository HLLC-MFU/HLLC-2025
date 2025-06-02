// stores/useProfile.ts
import { create } from "zustand";
import { apiRequest } from "@/utils/api";

interface UserData {
  _id: string;
  username: string;
  name: {
    first: string;
    last: string;
  };
  role: {
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface User {
  data: UserData[];
  message: string;
}

interface ProfileStore {
  user: User | null;
  setUser: (user: User | null) => void;
  getProfile: () => Promise<User | null>;
}

const useProfile = create<ProfileStore>((set) => ({
  user: null,

  setUser: (user) => set({ user }),

  getProfile: async () => {
    try {
      const res = await apiRequest<User>("/users/profile");
      if (res.statusCode === 200 && res.data) {
        set({ user: res.data });
        console.log(res.data);
        return res.data;
      } else {
        return null;
      }
    } catch (err) {
      console.error("❌ Failed to fetch profile", err);
      return null;
    }
  },
}));

export default useProfile;
