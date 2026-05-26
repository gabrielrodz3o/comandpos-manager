import { useQuery } from '@tanstack/react-query';
import { useFiltersStore } from '@store/useFiltersStore';
import { fetchTipsAnalysis } from '@services/reports/tipsAnalysis';
import { useEffectiveLocationId } from './useEffectiveLocationId';
import { logger } from '@utils/logger';

export const useTipsAnalysis = () => {
  const eff = useEffectiveLocationId();
  const startDate = useFiltersStore((s) => s.startDate);
  const endDate = useFiltersStore((s) => s.endDate);

  const query = useQuery({
    queryKey: ['tips-analysis', eff.locationId, startDate, endDate],
    queryFn: () => {
      if (!eff.locationId) throw new Error('No location');
      logger.info('[tips-analysis]', { locationId: eff.locationId, startDate, endDate });
      return fetchTipsAnalysis({
        location_id: eff.locationId,
        date_from: startDate,
        date_to: endDate,
      });
    },
    enabled: !!eff.locationId,
    staleTime: 30_000,
  });

  return { ...query, eff };
};
