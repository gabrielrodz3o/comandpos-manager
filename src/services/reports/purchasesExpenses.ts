import { api } from '@services/apiClient';
import type { ReportQueryBody } from '@/types/api';
import type { PurchasesExpensesResponse } from '@/types/reports';

export const fetchPurchasesExpenses = async (
  body: ReportQueryBody,
): Promise<PurchasesExpensesResponse> => {
  const { data } = await api.post<PurchasesExpensesResponse>(
    '/api/reports/purchases-expenses-dashboard',
    body,
  );
  return data;
};
