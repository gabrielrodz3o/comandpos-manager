import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthUser } from '@/types/business';

// URL del backend. Configurable por entorno con EXPO_PUBLIC_API_URL
// (ej. local en dev). Si no está definida, usa producción.
const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL?.trim() || undefined;
export const DEFAULT_API_BASE_URL = ENV_API_URL ?? 'https://restaurante.comandpos.com';

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
      apiBaseUrl: DEFAULT_API_BASE_URL,
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
        if (state) {
          // Si hay env explícito, manda sobre el valor persistido
          // (permite cambiar de entorno cambiando EXPO_PUBLIC_API_URL y recargando).
          if (ENV_API_URL && state.apiBaseUrl !== ENV_API_URL) {
            state.setApiBaseUrl(ENV_API_URL);
          } else if (!state.apiBaseUrl) {
            state.setApiBaseUrl(DEFAULT_API_BASE_URL);
          }
        }
        state?.setHydrated();
      },
    },
  ),
);
