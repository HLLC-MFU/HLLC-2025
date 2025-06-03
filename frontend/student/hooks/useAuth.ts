import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '@/utils/api';
import { getToken, saveToken, removeToken } from '@/utils/storage';
import { router } from 'expo-router';
import useProfile from './useProfile';

interface TokenResponse {
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface AuthStore {
  loading: boolean;
  error: string | null;
  signIn: (username: string, password: string) => Promise<boolean>;
  signUp: (userData: {
    username: string;
    password: string;
    confirmPassword: string;
    secret: string;
  }) => Promise<boolean>;
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

          const res = await apiRequest<TokenResponse>('/auth/login', 'POST', {
            username,
            password,
          });
          console.log('Login log', res);

          if (res.statusCode === 201 && res.data) {
            await saveToken('accessToken', res.data.tokens.accessToken);
            await saveToken('refreshToken', res.data.tokens.refreshToken);
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
          console.error('Login error:', err);
          set({ error: (err as Error).message });
          return false; // ❌ Login failed
        } finally {
          set({ loading: false });
        }
      },

      signUp: async (userData) => {
        try {
          set({ loading: true, error: null });

          const res = await apiRequest<TokenResponse>('/auth/register', 'POST', userData);
          console.log('Register response:', res);

          if (res.statusCode === 201 && res.data?.tokens) {
            await saveToken('accessToken', res.data.tokens.accessToken);
            await saveToken('refreshToken', res.data.tokens.refreshToken);
            const { getProfile } = useProfile.getState();
            const user = await getProfile();
            if (user) {
              router.replace("/");
              return true; // ✅ Registration successful
            }
          }

          set({ error: res.message || 'Registration failed' });
          return false; // ❌ Registration failed
        } catch (err) {
          console.error('Registration error:', err);
          set({ error: (err as Error).message });
          return false; // ❌ Registration failed
        } finally {
          set({ loading: false });
        }
      },

      signOut: () => {
        removeToken('accessToken');
        removeToken('refreshToken');
        useProfile.getState().setUser(null);
      },

      refreshSession: async () => {
        try {
          const refreshToken = await getToken('refreshToken');
          if (!refreshToken) return false;

          const res = await apiRequest<TokenResponse>('/auth/refresh', 'POST', {
            refreshToken,
          });

          if (res.statusCode === 201 && res.data) {
            await saveToken('accessToken', res.data.tokens.accessToken);
            await saveToken('refreshToken', res.data.tokens.refreshToken);
            await useProfile.getState().getProfile();
            return true;
          }

          return false;
        } catch (err) {
          console.error('Refresh session failed', err);
          return false;
        }
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({}),
    },
  ),
);

export default useAuth;
