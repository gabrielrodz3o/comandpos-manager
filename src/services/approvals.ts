import { api } from '@services/apiClient';
import type {
  VacationRequest,
  VacationStatus,
  PurchaseSuggestion,
  SuggestionStatus,
} from '@/types/approvals';

// ── VACATIONS ───────────────────────────────────────────────────
export const fetchVacations = async (params: {
  business_unit_id?: number;
  location_id?: number;
  status?: VacationStatus;
  employee_id?: number;
}): Promise<VacationRequest[]> => {
  const qs = new URLSearchParams();
  if (params.business_unit_id) qs.set('business_unit_id', String(params.business_unit_id));
  if (params.location_id) qs.set('location_id', String(params.location_id));
  if (params.status) qs.set('status', params.status);
  if (params.employee_id) qs.set('employee_id', String(params.employee_id));

  const { data } = await api.get<VacationRequest[] | { data?: VacationRequest[] }>(
    `/api/hr/vacations?${qs.toString()}`,
  );
  if (Array.isArray(data)) return data;
  return data.data ?? [];
};

export const approveVacation = async (params: {
  id: number;
  approved_by: number;
  action: 'APROBADO' | 'RECHAZADO';
  notes?: string;
}): Promise<{ id: number; status: string }> => {
  const { data } = await api.put<{ id: number; status: string }>(
    `/api/hr/vacations/${params.id}/approve`,
    {
      action: params.action,
      approved_by: params.approved_by,
      notes: params.notes,
    },
  );
  return data;
};

// ── PURCHASE SUGGESTIONS ────────────────────────────────────────
export const fetchPurchaseSuggestions = async (params: {
  business_unit_id: number;
  location_id: number;
  status?: SuggestionStatus | 'ALL';
  urgency_level?: number;
  limit?: number;
}): Promise<PurchaseSuggestion[]> => {
  const { data } = await api.post<
    | { success?: boolean; data?: PurchaseSuggestion[]; suggestions?: PurchaseSuggestion[] }
    | PurchaseSuggestion[]
  >('/api/restaurant/shop/purchase-suggestions', {
    business_unit_id: params.business_unit_id,
    location_id: params.location_id,
    status: params.status ?? 'PENDING',
    limit: params.limit ?? 100,
    urgency_level: params.urgency_level ?? null,
  });

  const list = Array.isArray(data) ? data : data.data ?? data.suggestions ?? [];

  return list.map((s) => ({
    ...s,
    estimated_total: Number(s.suggested_quantity ?? 0) * Number(s.suggested_price ?? 0),
  }));
};

export const approvePurchaseSuggestion = async (params: {
  suggestion_id: number;
  approved_by: number;
  business_unit_id: number;
  location_id: number;
  notes?: string;
  approval_quantity?: number;
}) => {
  const { data } = await api.post('/api/restaurant/shop/approve-suggestion', {
    suggestion_id: params.suggestion_id,
    approved_by: params.approved_by,
    business_unit_id: params.business_unit_id,
    location_id: params.location_id,
    notes: params.notes,
    approval_quantity: params.approval_quantity,
  });
  return data;
};
