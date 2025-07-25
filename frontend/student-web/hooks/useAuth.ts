'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { addToast } from '@heroui/react';
import { redirect } from 'next/navigation';
import { useProfile } from './useProfile';
import { apiRequest } from '@/utils/api';
import { getToken, saveToken, removeToken } from '@/utils/storage';

interface AuthStore {
  loading: boolean;
  error: string | null;
  signIn: (username: string, password: string) => Promise<boolean>;
  signOut: () => void;
  refreshSession: () => Promise<boolean>;
  isLoggedIn: () => boolean;
  ensureValidSession: () => Promise<boolean>;
  resetPassword: (resetData: {
    username: string;
    password: string;
    confirmPassword: string;
    metadata: { secret: string };
  }) => Promise<true | string>;

  register: (data: {
    username: string;
    password: string;
    confirmPassword: string;
    metadata: {
      secret: string;
    };
  }) => Promise<true | string>;
}
let isSigningOut = false;
const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      loading: false,
      error: null,

      signIn: async (username, password) => {
        try {
          set({ loading: true, error: null });

          // 1. Login เพื่อ set cookie
          const resCookie = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/login?useCookies=true`,
            {
              method: 'POST',
              body: JSON.stringify({ username, password }),
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
            },
          );

          if (resCookie.status !== 201) {
            set({ error: resCookie.statusText });
            addToast({
              title: 'Login failed',
              color: 'danger',
              description: 'Invalid credentials.',
              variant: 'solid',
            });
            return false;
          }

          // 2. Login อีกรอบเพื่อดึง accessToken
          const resToken = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
            {
              method: 'POST',
              body: JSON.stringify({ username, password }),
              headers: { 'Content-Type': 'application/json' },
              // ไม่ต้องใส่ credentials: 'include'
            },
          );

          const data = await resToken.json();

          if (process.env.NODE_ENV !== 'production') {
            console.log('[signIn] Login response data (token):', data);
          }

          // Extract tokens from nested 'tokens' object if present
          const accessToken = data?.accessToken || data?.tokens?.accessToken;
          const refreshToken = data?.refreshToken || data?.tokens?.refreshToken;

          if (process.env.NODE_ENV !== 'production') {
            console.log('[signIn] Extracted accessToken:', accessToken);
            console.log('[signIn] Extracted refreshToken:', refreshToken);
          }

          if (accessToken) {
            saveToken('accessToken', accessToken);
            if (process.env.NODE_ENV !== 'production') {
              console.log('[signIn] Saved accessToken:', accessToken);
            }
          } else {
            addToast({
              title: 'Login warning',
              color: 'danger',
              description: 'No accessToken received from backend. WebSocket will not work.',
              variant: 'solid',
            });
          }

          if (refreshToken) {
            saveToken('refreshToken', refreshToken);
            if (process.env.NODE_ENV !== 'production') {
              console.log('[signIn] Saved refreshToken:', refreshToken);
            }
          }

          addToast({
            title: 'Login successful',
            color: 'success',
            description: 'You have successfully logged in.',
            variant: 'solid',
          });

          redirect('/');

          return true;
        } catch (err) {
          set({ error: (err as Error).message });
          return false;
        } finally {
          set({ loading: false });
        }
      },

      signOut: async () => {
        // Prevent double execution
        if (isSigningOut) return;
        isSigningOut = true;

        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/logout`,
            {
              method: 'POST',
              credentials: 'include',
            },
          );

          if (res.status !== 201) {
            addToast({
              title: 'Logout failed',
              color: 'danger',
              description: 'Failed to log out. Please try again.',
              variant: 'solid',
            });

            return;
          }

          addToast({
            title: 'Logged out',
            color: 'success',
            description: 'You have successfully logged out.',
            variant: 'solid',
          });

          // Clear user and tokens
          useProfile.getState().clearUser();
          removeToken('accessToken');
          removeToken('refreshToken');
        } catch (err) {
          addToast({
            title: 'Logout error',
            color: 'danger',
            description:
              err instanceof Error ? err.message : 'Something went wrong',
            variant: 'solid',
          });
        } finally {
          isSigningOut = false; // reset flag so logout can happen again later
        }
      },

      refreshSession: async () => {
        try {
          const refreshToken = getToken('refreshToken');

          if (!refreshToken) return false;

          const res = await apiRequest<TokenResponse>('/auth/refresh', 'POST', {
            refreshToken,
          });

          if (res.statusCode === 200 && res.data) {
            saveToken('accessToken', res.data.accessToken);
            saveToken('refreshToken', res.data.refreshToken);

            return true;
          }

          return false;
        } catch (err) {
          addToast({
            title: err instanceof Error ? err.message : 'An error occurred',
            color: 'danger',
            description: 'Failed to refresh session. Please log in again.',
            variant: 'solid',
          });

          return false;
        }
      },

      register: async data => {
        try {
          set({ loading: true, error: null });

          const res = await apiRequest<{ message: string; user?: any }>(
            '/auth/register',
            'POST',
            data,
          );

          if (res.statusCode === 200 || res.statusCode === 201) {
            addToast({
              title: 'Registration complete',
              color: 'success',
              description: 'You have successfully registered.',
              variant: 'solid',
            });

            return true;
          } else {
            set({ error: res.message || 'Registration failed' });
            addToast({
              title: 'Registration failed',
              color: 'danger',
              description: res.message || 'Please try again.',
              variant: 'solid',
            });

            return res.message || 'Registration failed';
          }
        } catch (err) {
          return (err as Error).message || 'Network error';
        } finally {
          set({ loading: false });
        }
      },

      resetPassword: async (resetData: {
        username: string;
        password: string;
        confirmPassword: string;
        metadata: { secret: string };
      }): Promise<true | string> => {
        try {
          set({ loading: true, error: null });

          const res = await apiRequest<{ message: string }>(
            '/auth/reset-password',
            'POST',
            resetData,
          );

          if (
            (res.statusCode === 200 || res.statusCode === 201) &&
            res.data?.message === 'Password reset successfully'
          ) {
            return true;
          }

          return res.message || 'Reset password failed';
        } catch (err) {
          return (err as Error).message || 'Network error';
        } finally {
          set({ loading: false });
        }
      },

      isLoggedIn: () => {
        const accessToken = getToken('accessToken');

        return !!accessToken;
      },
      ensureValidSession: async () => {
        const accessToken = getToken('accessToken');

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
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export default useAuth;

/**
 * 🛠️ Helper to check if JWT is expired
 */
function isTokenExpired(token: string): boolean {
  try {
    const [, payloadBase64] = token.split('.');
    const payload = JSON.parse(atob(payloadBase64));
    const exp = payload.exp;
    const currentTime = Math.floor(Date.now() / 1000);

    return exp < currentTime;
  } catch (err) {
    addToast({
      title: 'Error',
      color: 'danger',
      description: err instanceof Error ? err.message : 'Invalid token format',
      variant: 'solid',
    });

    return true;
  }
}
