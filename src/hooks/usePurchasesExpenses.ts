import { useQuery } from '@tanstack/react-query';
import { useReportBody } from './useReportBody';
import { fetchPurchasesExpenses } from '@services/reports/purchasesExpenses';

export const usePurchasesExpenses = () => {
  const body = useReportBody();
  return useQuery({
    queryKey: ['purchases-expenses', body],
    queryFn: () => {
      if (!body) throw new Error('No business unit');
      return fetchPurchasesExpenses(body);
    },
    enabled: !!body,
    staleTime: 30_000,
  });
};
