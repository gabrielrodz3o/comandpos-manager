import { api } from '@services/apiClient';
import type { TipsAnalysisResponse } from '@/types/reports';

interface TipsAnalysisParams {
  location_id: number;
  date_from: string;
  date_to: string;
}

export const fetchTipsAnalysis = async (params: TipsAnalysisParams): Promise<TipsAnalysisResponse> => {
  const { data } = await api.post<TipsAnalysisResponse>(
    '/api/restaurant/reports/tips-analysis',
    params,
  );
  return data;
};
