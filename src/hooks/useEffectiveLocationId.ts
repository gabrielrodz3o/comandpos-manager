import { useMemo } from 'react';
import { useBusinessStore } from '@store/useBusinessStore';
import { filterActiveLocations, type LocationInfo } from '@/types/business';

export interface EffectiveLocation {
  locationId: number | null;
  location: LocationInfo | null;
  needsExplicitSelection: boolean;
  availableLocations: LocationInfo[];
}

/**
 * Resuelve la location efectiva para endpoints que NO soportan consolidado.
 * Solo considera sucursales con status_id === 1 (activas).
 */
export const useEffectiveLocationId = (): EffectiveLocation => {
  const selectedId = useBusinessStore((s) => s.selectedLocationId);
  const activeBu = useBusinessStore((s) => s.activeBusinessUnit);

  return useMemo(() => {
    const available = filterActiveLocations(activeBu?.locations ?? []);

    if (selectedId) {
      const loc = available.find((l) => l.id === selectedId) ?? null;
      // Si la location seleccionada ya no está activa, requiere re-selección
      if (!loc) {
        return {
          locationId: null,
          location: null,
          needsExplicitSelection: available.length > 1,
          availableLocations: available,
        };
      }
      return {
        locationId: selectedId,
        location: loc,
        needsExplicitSelection: false,
        availableLocations: available,
      };
    }

    if (available.length === 1) {
      return {
        locationId: available[0].id,
        location: available[0],
        needsExplicitSelection: false,
        availableLocations: available,
      };
    }

    return {
      locationId: null,
      location: null,
      needsExplicitSelection: available.length > 1,
      availableLocations: available,
    };
  }, [selectedId, activeBu]);
};
