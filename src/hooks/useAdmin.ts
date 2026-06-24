import { useQuery } from '@tanstack/react-query';
import { useBusinessStore } from '@store/useBusinessStore';
import { useEffectiveLocationId } from './useEffectiveLocationId';
import {
  fetchCashPosition,
  fetchTreasuryAccounts,
  fetchBankAccounts,
  fetchAccountsPayable,
  fetchCostAnalysis,
  fetchCourtesies,
  fetchDiscounts,
  fetchDeletedItems,
  fetchPriceChanges,
  fetchAuditTrail,
} from '@services/admin';

interface Range {
  start: string;
  end: string;
}

// ── Posición de Efectivo (snapshot consolidado: cajas + tesorería + bancos) ──
export const useCashPosition = () => {
  const eff = useEffectiveLocationId();
  const buId = useBusinessStore((s) => s.activeBusinessUnitId);

  const query = useQuery({
    queryKey: ['cash-position', buId, eff.locationId],
    queryFn: async () => {
      if (!buId) throw new Error('No business unit');
      const [position, treasury, banks] = await Promise.all([
        fetchCashPosition({ business_unit_id: buId, location_id: eff.locationId ?? null }),
        fetchTreasuryAccounts({ business_unit_id: buId, location_id: eff.locationId ?? null }),
        fetchBankAccounts(buId).catch(() => []),
      ]);
      return { position, treasury, banks };
    },
    enabled: !!buId,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  return { ...query, eff };
};

// ── Cuentas por Pagar ───────────────────────────────────────────────
export const useAccountsPayable = () => {
  const eff = useEffectiveLocationId();
  const query = useQuery({
    queryKey: ['accounts-payable', eff.locationId],
    queryFn: () => {
      if (!eff.locationId) throw new Error('No location');
      return fetchAccountsPayable(eff.locationId);
    },
    enabled: !!eff.locationId,
    staleTime: 60_000,
  });
  return { ...query, eff };
};

// ── Análisis de Costos ──────────────────────────────────────────────
export const useCostAnalysis = (range: Range) => {
  const eff = useEffectiveLocationId();
  const query = useQuery({
    queryKey: ['cost-analysis', eff.locationId, range.start, range.end],
    queryFn: () => {
      if (!eff.locationId) throw new Error('No location');
      return fetchCostAnalysis({
        date_from: range.start,
        date_to: range.end,
        location_id: eff.locationId,
      });
    },
    enabled: !!eff.locationId,
    staleTime: 30_000,
  });
  return { ...query, eff };
};

// ── Control / Auditoría (un hook por sub-reporte; enabled por tab activo) ──
export const useCourtesies = (range: Range, enabled: boolean) => {
  const eff = useEffectiveLocationId();
  return useQuery({
    queryKey: ['ctrl-courtesies', eff.locationId, range.start, range.end],
    queryFn: () =>
      fetchCourtesies({ date_from: range.start, date_to: range.end, location_id: eff.locationId }),
    enabled: enabled && !!eff.locationId,
    staleTime: 30_000,
  });
};

export const useDiscounts = (range: Range, enabled: boolean) => {
  const eff = useEffectiveLocationId();
  const buId = useBusinessStore((s) => s.activeBusinessUnitId);
  return useQuery({
    queryKey: ['ctrl-discounts', buId, eff.locationId, range.start, range.end],
    queryFn: () =>
      fetchDiscounts({
        date_from: range.start,
        date_to: range.end,
        business_unit_id: buId,
        location_id: eff.locationId,
      }),
    enabled: enabled && !!eff.locationId,
    staleTime: 30_000,
  });
};

export const useDeletedItems = (range: Range, enabled: boolean) => {
  const eff = useEffectiveLocationId();
  return useQuery({
    queryKey: ['ctrl-deleted', eff.locationId, range.start, range.end],
    queryFn: () =>
      fetchDeletedItems({ date_from: range.start, date_to: range.end, location_id: eff.locationId }),
    enabled: enabled && !!eff.locationId,
    staleTime: 30_000,
  });
};

export const usePriceChanges = (range: Range, enabled: boolean) => {
  const eff = useEffectiveLocationId();
  return useQuery({
    queryKey: ['ctrl-prices', eff.locationId, range.start, range.end],
    queryFn: () =>
      fetchPriceChanges({ date_from: range.start, date_to: range.end, location_id: eff.locationId }),
    enabled: enabled && !!eff.locationId,
    staleTime: 30_000,
  });
};

export const useAuditTrail = (range: Range, enabled: boolean) => {
  const eff = useEffectiveLocationId();
  return useQuery({
    queryKey: ['ctrl-audit', eff.locationId, range.start, range.end],
    queryFn: () =>
      fetchAuditTrail({ date_from: range.start, date_to: range.end, location_id: eff.locationId }),
    enabled: enabled && !!eff.locationId,
    staleTime: 30_000,
  });
};
