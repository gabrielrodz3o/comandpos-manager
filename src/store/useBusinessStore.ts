import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BusinessUnitAccess, LocationInfo } from '@/types/business';

interface BusinessState {
  activeBusinessUnitId: number | null;
  activeBusinessUnit: BusinessUnitAccess | null;
  /** Si null → consolidado (todas las locations de la BU activa). */
  selectedLocationId: number | null;
  setActiveBusinessUnit: (bu: BusinessUnitAccess | null) => void;
  setSelectedLocation: (locationId: number | null) => void;
  reset: () => void;
  /** Devuelve las locations de la BU activa filtradas por status_id activo. */
  getAvailableLocations: () => LocationInfo[];
}

export const useBusinessStore = create<BusinessState>()(
  persist(
    (set, get) => ({
      activeBusinessUnitId: null,
      activeBusinessUnit: null,
      selectedLocationId: null,
      setActiveBusinessUnit: (bu) =>
        set({
          activeBusinessUnit: bu,
          activeBusinessUnitId: bu?.business_unit_id ?? null,
          selectedLocationId: null,
        }),
      setSelectedLocation: (selectedLocationId) => set({ selectedLocationId }),
      reset: () =>
        set({
          activeBusinessUnit: null,
          activeBusinessUnitId: null,
          selectedLocationId: null,
        }),
      getAvailableLocations: () => {
        const bu = get().activeBusinessUnit;
        if (!bu?.locations) return [];
        return bu.locations.filter((loc) => loc.status_id == null || loc.status_id === 1);
      },
    }),
    {
      name: 'comandpos-business',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
