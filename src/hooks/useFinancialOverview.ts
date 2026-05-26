import { useQuery } from '@tanstack/react-query';
import { fetchFinancialOverview } from '@services/dashboard';
import { logger } from '@utils/logger';
import { useReportBody } from './useReportBody';

export const useFinancialOverview = () => {
  const body = useReportBody();

  return useQuery({
    queryKey: ['financial-overview', body],
    queryFn: async () => {
      if (!body) throw new Error('No business unit selected');
      logger.info('[financial-overview]', 'Fetching...', body);
      const data = await fetchFinancialOverview(body);
      logger.info('[financial-overview]', 'Got data. Summary keys:', Object.keys(data?.summary ?? {}));
      return data;
    },
    enabled: !!body,
    staleTime: 30_000,
  });
};
