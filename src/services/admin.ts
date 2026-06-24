import { api } from '@services/apiClient';
import type {
  AccountsPayableResponse,
  CashPositionData,
  TreasuryAccount,
  BankAccount,
  CostAnalysisResponse,
  Courtesy,
  DiscountsResponse,
  DeletedItem,
  PriceChange,
  AuditTrailResponse,
} from '@/types/admin';

const qs = (params: Record<string, unknown>): string => {
  const u = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') u.set(k, String(v));
  });
  const s = u.toString();
  return s ? `?${s}` : '';
};

interface BuScope {
  business_unit_id: number;
  location_id?: number | null;
}
interface DateRange {
  date_from: string;
  date_to: string;
  location_id?: number | null;
}

// ── Posición de Efectivo / Tesorería ────────────────────────────────
export const fetchCashPosition = async (p: BuScope): Promise<CashPositionData> => {
  const { data } = await api.get<{ success?: boolean; data?: CashPositionData }>(
    `/api/restaurant/transactions/cash-position${qs({
      business_unit_id: p.business_unit_id,
      location_id: p.location_id ?? undefined,
    })}`,
  );
  return (
    data?.data ?? { boxes: [], by_location: [], by_currency: [], open_count: 0 }
  );
};

export const fetchTreasuryAccounts = async (p: BuScope): Promise<TreasuryAccount[]> => {
  const { data } = await api.get<{ success?: boolean; data?: { accounts?: TreasuryAccount[] } }>(
    `/api/restaurant/treasury/accounts${qs({
      business_unit_id: p.business_unit_id,
      location_id: p.location_id ?? undefined,
    })}`,
  );
  return data?.data?.accounts ?? [];
};

export const fetchBankAccounts = async (business_unit_id: number): Promise<BankAccount[]> => {
  const { data } = await api.post<BankAccount[] | { data?: BankAccount[] }>(
    '/api/restaurant/banks/get-accounts',
    { business_unit_id },
    { skipErrorToast: true },
  );
  if (Array.isArray(data)) return data;
  return data?.data ?? [];
};

// ── Cuentas por Pagar (CxP) ─────────────────────────────────────────
export const fetchAccountsPayable = async (location_id: number): Promise<AccountsPayableResponse> => {
  const { data } = await api.post<AccountsPayableResponse>(
    '/api/restaurant/reports/accounts-payable',
    { location_id },
  );
  return data;
};

// ── Análisis de Costos ──────────────────────────────────────────────
export const fetchCostAnalysis = async (p: DateRange): Promise<CostAnalysisResponse> => {
  const { data } = await api.post<CostAnalysisResponse>(
    '/api/restaurant/reports/cost-analysis',
    { date_from: p.date_from, date_to: p.date_to, location_id: p.location_id ?? null },
  );
  return data;
};

// ── Control / Auditoría ─────────────────────────────────────────────
export const fetchCourtesies = async (p: DateRange): Promise<Courtesy[]> => {
  const { data } = await api.post<Courtesy[]>('/api/restaurant/reports/courtesies', {
    date_from: p.date_from,
    date_to: p.date_to,
    location_id: p.location_id ?? undefined,
  });
  return Array.isArray(data) ? data : [];
};

export const fetchDiscounts = async (p: {
  date_from: string;
  date_to: string;
  business_unit_id?: number | null;
  location_id?: number | null;
}): Promise<DiscountsResponse> => {
  const { data } = await api.get<{ success?: boolean; data?: DiscountsResponse['data']; totals?: DiscountsResponse['totals'] }>(
    `/api/restaurant/reports/discounts${qs({
      startDate: p.date_from,
      endDate: p.date_to,
      businessUnitId: p.business_unit_id ?? undefined,
      locationId: p.location_id ?? undefined,
    })}`,
  );
  return {
    data: data?.data ?? [],
    totals:
      data?.totals ?? {
        total_invoices: 0,
        total_discount_amount: 0,
        total_subtotal_amount: 0,
        average_discount_percentage: 0,
        promotion_discounts: 0,
        manual_discounts: 0,
        promotion_count: 0,
        manual_count: 0,
      },
  };
};

export const fetchDeletedItems = async (p: DateRange): Promise<DeletedItem[]> => {
  const { data } = await api.post<DeletedItem[]>('/api/restaurant/reports/deleted-items', {
    date_from: p.date_from,
    date_to: p.date_to,
    location_id: p.location_id ?? undefined,
  });
  return Array.isArray(data) ? data : [];
};

export const fetchPriceChanges = async (p: DateRange): Promise<PriceChange[]> => {
  const { data } = await api.post<PriceChange[]>('/api/restaurant/reports/price-changes', {
    date_from: p.date_from,
    date_to: p.date_to,
    location_id: p.location_id ?? undefined,
  });
  return Array.isArray(data) ? data : [];
};

export const fetchAuditTrail = async (p: DateRange): Promise<AuditTrailResponse> => {
  const { data } = await api.post<AuditTrailResponse>('/api/restaurant/reports/audit-trail', {
    date_from: p.date_from,
    date_to: p.date_to,
    location_id: p.location_id ?? undefined,
  });
  return data;
};
