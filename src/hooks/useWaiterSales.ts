import { useQuery } from '@tanstack/react-query';
import { useFiltersStore } from '@store/useFiltersStore';
import { fetchWaiterSales } from '@services/reports/waiterSales';
import { useEffectiveLocationId } from './useEffectiveLocationId';
import { logger } from '@utils/logger';

export const useWaiterSales = () => {
  const eff = useEffectiveLocationId();
  const startDate = useFiltersStore((s) => s.startDate);
  const endDate = useFiltersStore((s) => s.endDate);

  const query = useQuery({
    queryKey: ['waiter-sales', eff.locationId, startDate, endDate],
    queryFn: async () => {
      if (!eff.locationId) throw new Error('No location');
      logger.info('[waiter-sales]', 'request', {
        locationId: eff.locationId,
        locationName: eff.location?.description_long ?? eff.location?.description_short,
        dateFrom: startDate,
        dateTo: endDate,
      });
      const res = await fetchWaiterSales({
        locationId: eff.locationId,
        dateFrom: startDate,
        dateTo: endDate,
      });
      logger.info('[waiter-sales]', `Got ${res?.data?.length ?? 0} staff rows`, res?.summary);
      return res;
    },
    enabled: !!eff.locationId,
    staleTime: 30_000,
  });

  return { ...query, eff };
};
