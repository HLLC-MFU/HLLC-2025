import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest } from "@/utils/api";
import { getToken, saveToken, removeToken } from "@/utils/storage";
import { router } from "expo-router";
import useProfile from "./useProfile";

interface AuthStore {
  loading: boolean;
  error: string | null;
  signIn: (username: string, password: string) => Promise<boolean>;
  signOut: () => void;
  refreshSession: () => Promise<boolean>;
}

const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      loading: false,
      error: null,

      signIn: async (username, password) => {
        try {
          set({ loading: true, error: null });

          const res = await apiRequest<TokenResponse>("/auth/login", "POST", {
            username,
            password,
          });

          if (res.statusCode === 200 && res.data) {
            await saveToken("accessToken", res.data.accessToken);
            await saveToken("refreshToken", res.data.refreshToken);
            const { getProfile } = useProfile.getState();
            const user = await getProfile();
            if (user) {
              router.replace("/");
              return true; // ✅ Login successful
            }
          }

          set({ error: res.message });
          return false; // ❌ Login failed
        } catch (err) {
          set({ error: (err as Error).message });
          return false; // ❌ Login failed
        } finally {
          set({ loading: false });
        }
      },


      signOut: () => {
        removeToken("accessToken");
        removeToken("refreshToken");
        useProfile.getState().setUser(null);
      },

      refreshSession: async () => {
        try {
          const refreshToken = await getToken("refreshToken");
          if (!refreshToken) return false;

          const res = await apiRequest<TokenResponse>("/auth/refresh", "POST", {
            refreshToken,
          });

          if (res.statusCode === 200 && res.data) {
            await saveToken("accessToken", res.data.accessToken);
            await saveToken("refreshToken", res.data.refreshToken);
            await useProfile.getState().getProfile();
            return true;
          }

          return false;
        } catch (err) {
          console.error("Refresh session failed", err);
          return false;
        }
      },
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({}),
    }
  )
);

export default useAuth;
