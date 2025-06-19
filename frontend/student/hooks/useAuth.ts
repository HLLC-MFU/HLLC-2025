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
    _id: string;
    username: string;
    name: {
      first: string;
      middle?: string;
      last: string;
    };
    role: {
      _id: string;
      name: string;
      permissions: string[];
      metadataSchema: any[];
    };
    metadata?: {
      major: string;
    };
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
    metadata: {
      secret: string;
    };
  }) => Promise<boolean>;
  resetPassword: (userData: {
    username: string;
    password: string;
    confirmPassword: string;
    metadata: {
      secret: string;
    };
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

          if (res.statusCode === 201 && res.data) {
            await saveToken('accessToken', res.data.tokens.accessToken);
            await saveToken('refreshToken', res.data.tokens.refreshToken);
            
            // Wait longer for tokens to be saved and sync
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Verify token was saved correctly
            const savedToken = await getToken('accessToken');
            
            const { getProfile } = useProfile.getState();
            const user = await getProfile(res.data.tokens.accessToken);
            
            if (user) {
              router.replace("/");
              return true;
            } else {
              // Fallback: use user data from login response
              const { setUser } = useProfile.getState();
              if (res.data.user) {
                setUser(res.data.user);
                router.replace("/");
                return true;
              }
            }
          }

          set({ error: res.message });
          return false;
        } catch (err) {
          set({ error: (err as Error).message });
          return false;
        } finally {
          set({ loading: false });
        }
      },

      signUp: async (userData) => {
        try {
          set({ loading: true, error: null });

          const res = await apiRequest<TokenResponse>('/auth/register', 'POST', userData);

          if (res.statusCode === 201 && res.data?.tokens) {
            await saveToken('accessToken', res.data.tokens.accessToken);
            await saveToken('refreshToken', res.data.tokens.refreshToken);
            const { getProfile } = useProfile.getState();
            const user = await getProfile();
            if (user) {
              router.replace("/");
              return true;
            }
          }

          set({ error: res.message || 'Registration failed' });
          return false;
        } catch (err) {
          set({ error: (err as Error).message });
          return false;
        } finally {
          set({ loading: false });
        }
      },

      resetPassword: async (userData) => {
        try {
          set({ loading: true, error: null });

          const res = await apiRequest<{ message: string }>('/auth/reset-password', 'POST', userData);

          if ((res.statusCode === 200 || res.statusCode === 201) && res.data?.message === 'Password reset successfully') {
            return true;
          }

          set({ error: res.message || 'Reset password failed' });
          return false;
        } catch (err) {
          set({ error: (err as Error).message });
          return false;
        } finally {
          set({ loading: false });
        }
      },

      signOut: () => {
        removeToken('accessToken');
        removeToken('refreshToken');
        console.log(getToken('accessToken'), getToken('refreshToken'));
        useProfile.getState().clearProfile();
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
