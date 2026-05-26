import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBusinessStore } from '@store/useBusinessStore';
import { useAuthStore } from '@store/useAuthStore';
import {
  fetchVacations,
  approveVacation,
  fetchPurchaseSuggestions,
  approvePurchaseSuggestion,
} from '@services/approvals';
import { useEffectiveLocationId } from './useEffectiveLocationId';
import type { VacationStatus, SuggestionStatus } from '@/types/approvals';
import { logger } from '@utils/logger';

// ── VACATIONS ───────────────────────────────────────────────────
export const useVacations = (status: VacationStatus = 'PENDIENTE') => {
  const buId = useBusinessStore((s) => s.activeBusinessUnitId);
  const locationId = useBusinessStore((s) => s.selectedLocationId);

  return useQuery({
    queryKey: ['vacations', buId, locationId, status],
    queryFn: () => {
      if (!buId) throw new Error('No BU');
      logger.info('[vacations]', { buId, locationId, status });
      return fetchVacations({
        business_unit_id: buId,
        location_id: locationId ?? undefined,
        status,
      });
    },
    enabled: !!buId,
    staleTime: 30_000,
  });
};

export const useApproveVacation = () => {
  const userId = useAuthStore((s) => s.user?.use_id);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      id: number;
      action: 'APROBADO' | 'RECHAZADO';
      notes?: string;
    }) => {
      if (!userId) throw new Error('No user');
      return approveVacation({
        id: params.id,
        approved_by: userId,
        action: params.action,
        notes: params.notes,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vacations'] });
    },
  });
};

// ── PURCHASE SUGGESTIONS ────────────────────────────────────────
export const usePurchaseSuggestions = (status: SuggestionStatus | 'ALL' = 'PENDING') => {
  const buId = useBusinessStore((s) => s.activeBusinessUnitId);
  const eff = useEffectiveLocationId();

  const query = useQuery({
    queryKey: ['purchase-suggestions', buId, eff.locationId, status],
    queryFn: () => {
      if (!buId || !eff.locationId) throw new Error('Need BU and location');
      logger.info('[suggestions]', { buId, locationId: eff.locationId, status });
      return fetchPurchaseSuggestions({
        business_unit_id: buId,
        location_id: eff.locationId,
        status,
      });
    },
    enabled: !!buId && !!eff.locationId,
    staleTime: 30_000,
  });

  return { ...query, eff };
};

export const useApproveSuggestion = () => {
  const userId = useAuthStore((s) => s.user?.use_id);
  const buId = useBusinessStore((s) => s.activeBusinessUnitId);
  const eff = useEffectiveLocationId();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (params: { suggestion_id: number; notes?: string; approval_quantity?: number }) => {
      if (!userId || !buId || !eff.locationId) throw new Error('Missing context');
      return approvePurchaseSuggestion({
        suggestion_id: params.suggestion_id,
        approved_by: userId,
        business_unit_id: buId,
        location_id: eff.locationId,
        notes: params.notes,
        approval_quantity: params.approval_quantity,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchase-suggestions'] });
    },
  });
};
