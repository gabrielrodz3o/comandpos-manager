import { api } from './apiClient';
import type { FinancialOverviewResponse } from '@/types/reports';
import type { ReportQueryBody } from '@/types/api';

export const fetchFinancialOverview = async (
  body: ReportQueryBody,
): Promise<FinancialOverviewResponse> => {
  const { data } = await api.post<FinancialOverviewResponse>(
    '/api/dashboard/financial-overview',
    body,
  );
  return data;
};
