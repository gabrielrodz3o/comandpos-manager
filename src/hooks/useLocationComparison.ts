import { useQueries } from '@tanstack/react-query';
import { useBusinessStore } from '@store/useBusinessStore';
import { useFiltersStore } from '@store/useFiltersStore';
import { fetchFinancialOverview } from '@services/dashboard';
import type { FinancialOverviewResponse } from '@/types/reports';
import type { LocationInfo } from '@/types/business';

export interface LocationComparisonRow {
  location: LocationInfo;
  data?: FinancialOverviewResponse;
  isLoading: boolean;
  error: unknown;
}

/**
 * Trae financial-overview de cada sucursal individualmente para poder compararlas.
 * Solo se activa cuando hay >1 sucursal y consolidado activo (sin filtro de location).
 */
export const useLocationComparison = (): LocationComparisonRow[] => {
  const buId = useBusinessStore((s) => s.activeBusinessUnitId);
  const activeBu = useBusinessStore((s) => s.activeBusinessUnit);
  const startDate = useFiltersStore((s) => s.startDate);
  const endDate = useFiltersStore((s) => s.endDate);

  const locations = activeBu?.locations ?? [];

  const queries = useQueries({
    queries: locations.map((loc) => ({
      queryKey: ['location-compare', buId, loc.id, startDate, endDate],
      queryFn: () => {
        if (!buId) throw new Error('No BU');
        return fetchFinancialOverview({
          business_unit_id: buId,
          start_date: startDate,
          end_date: endDate,
          location_id: loc.id,
        });
      },
      enabled: !!buId && locations.length > 1,
      staleTime: 60_000,
    })),
  });

  return locations.map((loc, idx) => ({
    location: loc,
    data: queries[idx]?.data,
    isLoading: queries[idx]?.isLoading ?? false,
    error: queries[idx]?.error,
  }));
};
