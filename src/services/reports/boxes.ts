import { api } from '@services/apiClient';
import type {
  BoxEntry,
  BoxInvoice,
  BoxSalesDay,
  BoxDenominationGroup,
} from '@/types/reports';

interface BoxListParams {
  location_id: number;
  start_date: string;
  end_date: string;
}

export const fetchBoxesClosed = async (params: BoxListParams): Promise<BoxEntry[]> => {
  const { data } = await api.post<BoxEntry[]>('/api/restaurant/boxes/boxes-closed', params);
  return data;
};

export const fetchBoxEntryDetail = async (box_entry_id: number): Promise<BoxEntry> => {
  const { data } = await api.get<BoxEntry>(
    `/api/restaurant/boxes/box-entry-detail?box_entry_id=${box_entry_id}`,
  );
  return data;
};

export const fetchBoxInvoices = async (box_entry_id: number): Promise<BoxInvoice[]> => {
  const { data } = await api.post<BoxInvoice[]>('/api/restaurant/boxes/invoices-boxes', {
    box_entry_id,
  });
  return data;
};

export const fetchBoxSalesDay = async (box_entry_id: number): Promise<BoxSalesDay[]> => {
  const { data } = await api.post<BoxSalesDay[]>('/api/restaurant/boxes/sales-boxes-day', {
    box_entry_id,
  });
  return data;
};

/**
 * Desglose físico de billetes/monedas contado al cierre (cierre avanzado).
 * Devuelve [] si la sucursal no usa cierre avanzado o el cierre es antiguo.
 */
export const fetchBoxDenominations = async (
  box_entry_id: number,
): Promise<BoxDenominationGroup[]> => {
  const { data } = await api.get<BoxDenominationGroup[]>(
    `/api/restaurant/boxes/get-box-entry-denominations?box_entry_id=${box_entry_id}`,
    { skipErrorToast: true },
  );
  return Array.isArray(data) ? data : [];
};
