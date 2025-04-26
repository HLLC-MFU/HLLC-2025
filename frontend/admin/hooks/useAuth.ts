'use client';

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { apiRequest } from "@/utils/api";
import { getToken, saveToken, removeToken } from "@/utils/storage";

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

          const res = await apiRequest<TokenResponse>("/auth/admin/login", "POST", {
            username,
            password,
          });

          if (res.statusCode === 200 && res.data) {
            saveToken("accessToken", res.data.accessToken);
            saveToken("refreshToken", res.data.refreshToken);
            return true; // ✅ ส่ง true กลับไปให้ component จัดการ redirect เอง
          } else {
            set({ error: res.message });
            alert("Login failed!");
            return false;
          }
        } catch (err) {
          set({ error: (err as Error).message });
          return false;
        } finally {
          set({ loading: false });
        }
      },

      signOut: () => {
        removeToken("accessToken");
        removeToken("refreshToken");
      },

      refreshSession: async () => {
        try {
          const refreshToken = getToken("refreshToken");
          if (!refreshToken) return false;

          const res = await apiRequest<TokenResponse>("/auth/admin/refresh", "POST", {
            refreshToken,
          });

          if (res.statusCode === 200 && res.data) {
            saveToken("accessToken", res.data.accessToken);
            saveToken("refreshToken", res.data.refreshToken);
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
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useAuth;
