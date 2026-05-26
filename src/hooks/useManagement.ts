import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
  fetchWaiters,
  addWaiter,
  updateWaiter,
  deactivateWaiter,
  activateWaiter,
  resetWaiterPin,
  fetchPlaces,
  fetchTablesByPlace,
  addOrUpdateTable,
  searchInvoices,
  fetchInvoiceItems,
} from '@services/management';
import type { InvoiceSearchResult } from '@/types/management';
import { useEffectiveLocationId } from './useEffectiveLocationId';
import { logger } from '@utils/logger';

// ── WAITERS ─────────────────────────────────────────────────────
export const useWaiters = () => {
  const eff = useEffectiveLocationId();
  const query = useQuery({
    queryKey: ['waiters', eff.locationId],
    queryFn: () => {
      if (!eff.locationId) throw new Error('No location');
      logger.info('[waiters]', 'fetch', eff.locationId);
      return fetchWaiters(eff.locationId);
    },
    enabled: !!eff.locationId,
    staleTime: 30_000,
  });
  return { ...query, eff };
};

export const useAddWaiter = () => {
  const eff = useEffectiveLocationId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => {
      if (!eff.locationId) throw new Error('No location');
      return addWaiter({ name, location_id: eff.locationId });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['waiters'] });
    },
  });
};

export const useUpdateWaiter = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: number; name: string }) => updateWaiter(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['waiters'] });
    },
  });
};

export const useDeactivateWaiter = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deactivateWaiter(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['waiters'] });
    },
  });
};

export const useActivateWaiter = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => activateWaiter(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['waiters'] });
    },
  });
};

export const useResetWaiterPin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => resetWaiterPin(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['waiters'] });
    },
  });
};

// ── PLACES & TABLES ─────────────────────────────────────────────
export const usePlaces = () => {
  const eff = useEffectiveLocationId();
  const query = useQuery({
    queryKey: ['places', eff.locationId],
    queryFn: () => {
      if (!eff.locationId) throw new Error('No location');
      return fetchPlaces(eff.locationId);
    },
    enabled: !!eff.locationId,
    staleTime: 60_000,
  });
  return { ...query, eff };
};

export const useTablesByPlace = (placeId: number | null) =>
  useQuery({
    queryKey: ['tables-by-place', placeId],
    queryFn: () => {
      if (!placeId) throw new Error('No place');
      return fetchTablesByPlace(placeId);
    },
    enabled: !!placeId,
    staleTime: 30_000,
  });

export const useAddOrUpdateTable = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addOrUpdateTable,
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['tables-by-place', variables.in_place_id] });
    },
  });
};

// ── INVOICES ────────────────────────────────────────────────────
const PAGE_SIZE = 25;

export const useInvoicesSearchInfinite = (params: {
  search?: string;
  start_date?: string;
  end_date?: string;
}) => {
  const eff = useEffectiveLocationId();
  const query = useInfiniteQuery({
    queryKey: ['invoices-search-inf', eff.locationId, params],
    queryFn: ({ pageParam = 0 }) =>
      searchInvoices({
        ...params,
        location_id: eff.locationId ?? undefined,
        limit: PAGE_SIZE,
        offset: pageParam as number,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.offset + lastPage.limit : undefined,
    enabled: !!eff.locationId,
    staleTime: 30_000,
  });

  const invoices = (query.data?.pages ?? []).flatMap((p) => p.invoices);
  const total = query.data?.pages[0]?.total ?? 0;

  return { ...query, invoices, total, eff };
};

/**
 * Detalle de factura: combina header (de cache de search-invoices) con items
 * (de get-full-account-details). El endpoint /api/sales/:id está roto con 500.
 */
export const useInvoiceDetail = (id: number | null) => {
  const qc = useQueryClient();

  // Buscar el header en TODAS las queries de búsqueda cacheadas
  const headerFromCache = (): InvoiceSearchResult | null => {
    if (!id) return null;
    const all = qc.getQueriesData<{
      pages?: Array<{ invoices: InvoiceSearchResult[] }>;
    }>({ queryKey: ['invoices-search-inf'] });
    for (const [, data] of all) {
      const pages = data?.pages ?? [];
      for (const p of pages) {
        const found = p.invoices.find((inv) => inv.id === id || inv.invoice_id === id);
        if (found) return found;
      }
    }
    return null;
  };

  const itemsQuery = useQuery({
    queryKey: ['invoice-items', id],
    queryFn: () => {
      if (!id) throw new Error('No id');
      return fetchInvoiceItems(id);
    },
    enabled: !!id,
    staleTime: 60_000,
  });

  const header = headerFromCache();
  const data: InvoiceSearchResult | undefined = header
    ? { ...header, items: itemsQuery.data ?? [] }
    : undefined;

  return {
    data,
    isLoading: itemsQuery.isLoading,
    isRefetching: itemsQuery.isRefetching,
    refetch: () => itemsQuery.refetch(),
    error: itemsQuery.error,
  };
};
