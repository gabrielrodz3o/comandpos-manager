import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthUser } from '@/types/business';

interface AuthState {
  apiBaseUrl: string | null;
  token: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  setApiBaseUrl: (url: string) => void;
  setAuth: (token: string, user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      apiBaseUrl: null,
      token: null,
      user: null,
      hydrated: false,
      setApiBaseUrl: (apiBaseUrl) => set({ apiBaseUrl }),
      setAuth: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'comandpos-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        apiBaseUrl: state.apiBaseUrl,
        token: state.token,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
