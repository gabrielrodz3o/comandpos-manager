import { useQuery } from '@tanstack/react-query';
import { useFiltersStore } from '@store/useFiltersStore';
import { useBusinessStore } from '@store/useBusinessStore';
import { fetchPlKpis, fetchPlTrends } from '@services/reports/profitLoss';
import { logger } from '@utils/logger';

export const usePlKpis = () => {
  const buId = useBusinessStore((s) => s.activeBusinessUnitId);
  const locationId = useBusinessStore((s) => s.selectedLocationId);
  const startDate = useFiltersStore((s) => s.startDate);
  const endDate = useFiltersStore((s) => s.endDate);

  return useQuery({
    queryKey: ['pl-kpis', buId, locationId, startDate, endDate],
    queryFn: async () => {
      logger.info('[pl-kpis]', 'request', { startDate, endDate, buId, locationId });
      const data = await fetchPlKpis({
        date_from: startDate,
        date_to: endDate,
        business_unit_id: buId,
        location_id: locationId,
      });
      logger.info('[pl-kpis]', 'response keys:', Object.keys(data ?? {}));
      logger.debug('[pl-kpis]', 'kpis:', data?.kpis);
      return data;
    },
    enabled: !!buId,
    staleTime: 30_000,
  });
};

export const usePlTrends = () => {
  const buId = useBusinessStore((s) => s.activeBusinessUnitId);
  const locationId = useBusinessStore((s) => s.selectedLocationId);
  const startDate = useFiltersStore((s) => s.startDate);
  const endDate = useFiltersStore((s) => s.endDate);

  return useQuery({
    queryKey: ['pl-trends', buId, locationId, startDate, endDate],
    queryFn: async () => {
      const data = await fetchPlTrends({
        date_from: startDate,
        date_to: endDate,
        business_unit_id: buId,
        location_id: locationId,
      });
      logger.info('[pl-trends]', 'days:', data?.tendencia_diaria?.length ?? 0);
      return data;
    },
    enabled: !!buId,
    staleTime: 30_000,
  });
};
