import { api } from '@services/apiClient';
import type { PlKpisResponse, PlTrendsResponse } from '@/types/reports';

interface PlParams {
  date_from: string;
  date_to: string;
  location_id?: number | null;
  business_unit_id?: number | null;
}

export const fetchPlKpis = async (params: PlParams): Promise<PlKpisResponse> => {
  const { data } = await api.post<PlKpisResponse>('/api/restaurant/reports/pl-kpis', params);
  return data;
};

export const fetchPlTrends = async (params: PlParams): Promise<PlTrendsResponse> => {
  const { data } = await api.post<PlTrendsResponse>('/api/restaurant/reports/pl-trends', params);
  return data;
};
