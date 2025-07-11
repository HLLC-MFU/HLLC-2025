"use client"

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { addToast } from "@heroui/react";
import { redirect } from "next/navigation";

import { useProfile } from "./useProfile";

import { apiRequest } from "@/utils/api";
import { getToken, saveToken, removeToken } from "@/utils/storage";

interface AuthStore {
  loading: boolean;
  error: string | null;
  signIn: (username: string, password: string) => Promise<boolean>;
  signOut: () => void;
  removePassword: (username: string) => Promise<boolean>;
  refreshSession: () => Promise<boolean>;
  isLoggedIn: () => boolean;
  ensureValidSession: () => Promise<boolean>;
}

const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      loading: false,
      error: null,

      signIn: async (username, password) => {
        try {
          set({ loading: true, error: null });

          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login?useCookies=true`, {
            method: 'POST',
            body: JSON.stringify({ username, password }),
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });

          if (res.status === 201) {
            const data = await res.json();

            if (data?.user) {
              useProfile.getState().setUser(data.user);
            }

            addToast({
              title: "Login successful",
              color: "success",
              description: "You have successfully logged in.",
              variant: "solid",
            });

            redirect("/");

          } else {
            set({ error: res.statusText });
            addToast({
              title: "Login failed",
              color: "danger",
              description: "Invalid credentials.",
              variant: "solid",
            });

            return false;
          }
        } catch (err) {
          set({ error: (err as Error).message });

          return false;
        } finally {
          set({ loading: false });
        }
      },

      signOut: async () => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
          method: 'POST',
          credentials: 'include',
        });

        if (res.status !== 201) {
          addToast({
            title: "Logout failed",
            color: "danger",
            description: "Failed to log out. Please try again.",
            variant: "solid",
          });

          return;
        }

        addToast({
          title: "Logged out",
          color: "success",
          description: "You have successfully logged out.",
          variant: "solid",
        });

        useProfile.getState().clearUser();

        removeToken("accessToken");
        removeToken("refreshToken");
      },

      removePassword: async (username) => {
        try {
          set({ loading: true, error: null });

          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/remove-password`, {
            method: 'POST',
            body: JSON.stringify({ username }),
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });

          if (res.status === 200 || res.status === 201) {
            addToast({
              title: `Reset password successfully`,
              description: `Reset password successfully`,
              color: "success",
            });

            return true;
          } else {
            addToast({
                title: `Remove password failed`,
                description: `Failed to reset password`,
                color: "danger",
                variant: "solid",
              });

            return false;
          }

        } catch (err) {
          set({ error: (err as Error).message });

          return false;
        } finally {
          set({ loading: false });
        }
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
          addToast({
            title: err instanceof Error ? err.message : "An error occurred",
            color: "danger",
            description: "Failed to refresh session. Please log in again.",
            variant: "solid",
          })

          return false;
        }
      },

      isLoggedIn: () => {
        const accessToken = getToken("accessToken");

        return !!accessToken;
      },
      ensureValidSession: async () => {
        const accessToken = getToken("accessToken");

        if (!accessToken) return false;

        const isExpired = isTokenExpired(accessToken);

        if (isExpired) {
          const success = await get().refreshSession();

          return success;
        }

        return true;
      },
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useAuth;

/**
 * 🛠️ Helper to check if JWT is expired
 */
function isTokenExpired(token: string): boolean {
  try {
    const [, payloadBase64] = token.split(".");
    const payload = JSON.parse(atob(payloadBase64));
    const exp = payload.exp;
    const currentTime = Math.floor(Date.now() / 1000);

    return exp < currentTime;
  } catch (err) {
    addToast({
      title: "Error",
      color: "danger",
      description: err instanceof Error ? err.message : "Invalid token format",
      variant: "solid",
    })

    return true;
  }
}
