import { useQuery } from '@tanstack/react-query';
import { useReportBody } from './useReportBody';
import {
  fetchSalesSummary,
  fetchSalesPayments,
  fetchProductsAbc,
  fetchSalesTrends,
  fetchSalesLosses,
  fetchSalesCategories,
  fetchSalesComparatives,
} from '@services/reports/sales';
import { logger } from '@utils/logger';

export const useSalesSummary = () => {
  const body = useReportBody();
  return useQuery({
    queryKey: ['sales-summary', body],
    queryFn: () => {
      if (!body) throw new Error('No business unit');
      logger.info('[sales-summary]', body);
      return fetchSalesSummary(body);
    },
    enabled: !!body,
    staleTime: 30_000,
  });
};

export const useSalesPayments = () => {
  const body = useReportBody();
  return useQuery({
    queryKey: ['sales-payments', body],
    queryFn: () => {
      if (!body) throw new Error('No business unit');
      return fetchSalesPayments(body);
    },
    enabled: !!body,
    staleTime: 30_000,
  });
};

export const useProductsAbc = () => {
  const body = useReportBody();
  return useQuery({
    queryKey: ['products-abc', body],
    queryFn: () => {
      if (!body) throw new Error('No business unit');
      return fetchProductsAbc(body);
    },
    enabled: !!body,
    staleTime: 30_000,
  });
};

export const useSalesTrends = () => {
  const body = useReportBody();
  return useQuery({
    queryKey: ['sales-trends', body],
    queryFn: () => {
      if (!body) throw new Error('No business unit');
      return fetchSalesTrends(body);
    },
    enabled: !!body,
    staleTime: 30_000,
  });
};

export const useSalesLosses = () => {
  const body = useReportBody();
  return useQuery({
    queryKey: ['sales-losses', body],
    queryFn: () => {
      if (!body) throw new Error('No business unit');
      return fetchSalesLosses(body);
    },
    enabled: !!body,
    staleTime: 30_000,
  });
};

export const useSalesCategories = () => {
  const body = useReportBody();
  return useQuery({
    queryKey: ['sales-categories', body],
    queryFn: () => {
      if (!body) throw new Error('No business unit');
      return fetchSalesCategories(body);
    },
    enabled: !!body,
    staleTime: 30_000,
  });
};

export const useSalesComparatives = () => {
  const body = useReportBody();
  return useQuery({
    queryKey: ['sales-comparatives', body],
    queryFn: () => {
      if (!body) throw new Error('No business unit');
      return fetchSalesComparatives(body);
    },
    enabled: !!body,
    staleTime: 30_000,
  });
};
