import { api } from '@services/apiClient';
import type { ReportQueryBody } from '@/types/api';
import type {
  SalesSummaryResponse,
  PaymentsResponse,
  ProductsAbcResponse,
  TrendsResponse,
  LossesResponse,
  CategoriesResponse,
  ComparativesResponse,
} from '@/types/reports';

export const fetchSalesSummary = async (body: ReportQueryBody): Promise<SalesSummaryResponse> => {
  const { data } = await api.post<SalesSummaryResponse>('/api/restaurant/reports/analytics/summary', body);
  return data;
};

export const fetchSalesPayments = async (body: ReportQueryBody): Promise<PaymentsResponse> => {
  const { data } = await api.post<PaymentsResponse>('/api/restaurant/reports/analytics/payments', body);
  return data;
};

export const fetchProductsAbc = async (body: ReportQueryBody): Promise<ProductsAbcResponse> => {
  const { data } = await api.post<ProductsAbcResponse>('/api/restaurant/reports/analytics/products-abc', body);
  return data;
};

export const fetchSalesTrends = async (body: ReportQueryBody): Promise<TrendsResponse> => {
  const { data } = await api.post<TrendsResponse>('/api/restaurant/reports/analytics/trends', body);
  return data;
};

export const fetchSalesLosses = async (body: ReportQueryBody): Promise<LossesResponse> => {
  const { data } = await api.post<LossesResponse>('/api/restaurant/reports/analytics/losses', body);
  return data;
};

export const fetchSalesCategories = async (body: ReportQueryBody): Promise<CategoriesResponse> => {
  const { data } = await api.post<CategoriesResponse>('/api/restaurant/reports/analytics/categories', body);
  return data;
};

export const fetchSalesComparatives = async (body: ReportQueryBody): Promise<ComparativesResponse> => {
  const { data } = await api.post<ComparativesResponse>('/api/restaurant/reports/analytics/comparatives', body);
  return data;
};
