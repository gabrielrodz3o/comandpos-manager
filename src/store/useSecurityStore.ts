import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SecurityState {
  /** Si está activo, la app pide biometría/PIN al abrir y al volver de background. */
  appLockEnabled: boolean;
  hydrated: boolean;
  setAppLockEnabled: (value: boolean) => void;
  setHydrated: () => void;
}

export const useSecurityStore = create<SecurityState>()(
  persist(
    (set) => ({
      appLockEnabled: false,
      hydrated: false,
      setAppLockEnabled: (appLockEnabled) => set({ appLockEnabled }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'comandpos-security',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ appLockEnabled: state.appLockEnabled }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
