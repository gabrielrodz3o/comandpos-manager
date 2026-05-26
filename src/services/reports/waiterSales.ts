import { api } from '@services/apiClient';
import type { WaiterSalesResponse } from '@/types/reports';

interface WaiterSalesParams {
  locationId: number;
  dateFrom: string;
  dateTo: string;
  waiterId?: number;
  statusId?: number;
}

export const fetchWaiterSales = async (params: WaiterSalesParams): Promise<WaiterSalesResponse> => {
  const { data } = await api.post<WaiterSalesResponse>(
    '/api/restaurant/reports/waiter-sales',
    params,
  );
  return data;
};
