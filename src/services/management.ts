import { api } from './apiClient';
import type {
  Waiter,
  Place,
  RestaurantTable,
  InvoiceSearchResult,
  InvoiceSearchResponse,
} from '@/types/management';

// ── WAITERS ─────────────────────────────────────────────────────
export const fetchWaiters = async (locationId: number): Promise<Waiter[]> => {
  const { data } = await api.post<{ success?: boolean; data?: Waiter[] } | Waiter[]>(
    '/api/restaurant/waiter/get-by-location',
    { locationId },
  );
  if (Array.isArray(data)) return data;
  return data?.data ?? [];
};

export const addWaiter = async (params: {
  name: string;
  location_id: number;
}): Promise<unknown> => {
  const { data } = await api.post('/api/restaurant/data/add-waiter', params);
  return data;
};

export const updateWaiter = async (params: { id: number; name: string }): Promise<unknown> => {
  const { data } = await api.post('/api/restaurant/data/update-waiter', params);
  return data;
};

export const deactivateWaiter = async (id: number): Promise<unknown> => {
  const { data } = await api.post('/api/restaurant/data/desactive-waiter', {
    id,
    status_id: 2, // inactivo
  });
  return data;
};

export const activateWaiter = async (id: number): Promise<unknown> => {
  const { data } = await api.post('/api/restaurant/data/desactive-waiter', {
    id,
    status_id: 1, // activo
  });
  return data;
};

export const resetWaiterPin = async (id: number): Promise<unknown> => {
  const { data } = await api.post('/api/restaurant/data/reset-waiter-pin', { id });
  return data;
};

// ── PLACES & TABLES ─────────────────────────────────────────────
export const fetchPlaces = async (locationId: number): Promise<Place[]> => {
  const { data } = await api.post<Place[] | { data?: Place[] }>(
    '/api/restaurant/places/get-places-by-location',
    { id: locationId },
  );
  if (Array.isArray(data)) return data;
  return data.data ?? [];
};

/**
 * Trae mesas de un place. Usa `get-table-by-place` (anidado) que es más
 * estable que `get-all-table-by-place` (requiere construir SQL filters
 * peligroso).
 */
export const fetchTablesByPlace = async (placeId: number): Promise<RestaurantTable[]> => {
  interface PlaceWithTablesRow {
    place_id: number;
    place_name: string;
    tables: Array<{
      table_id: number;
      table_type_id?: number;
      table_type_name?: string;
      table_name: string;
      chairs?: number;
      pos_x?: number;
      pos_y?: number;
      width?: number;
      height?: number;
      shape?: string;
      rotation?: number;
      state_id?: number;
      state_name?: string;
      user_fullname?: string;
      waiter_name?: string;
    }> | null;
  }

  const { data } = await api.post<PlaceWithTablesRow[]>(
    '/api/restaurant/tables/get-table-by-place',
    { id: placeId },
  );

  const place = Array.isArray(data) ? data[0] : null;
  if (!place?.tables) return [];

  return place.tables.map((t) => ({
    id: t.table_id,
    table_name: t.table_name,
    table_state_id: t.state_id,
    table_type_id: t.table_type_id,
    table_type_name: t.table_type_name,
    place_name: place.place_name,
    place_id: place.place_id,
    chairs: t.chairs,
    pos_x: t.pos_x,
    pos_y: t.pos_y,
    width: t.width,
    height: t.height,
    shape: t.shape,
    rotation: t.rotation,
  }));
};

interface AddOrUpdateTableParams {
  in_table_id: number; // 0 para nuevo
  in_table_type_id: number;
  in_place_id: number;
  in_name: string;
  in_chairs: number;
  pos_x?: number;
  pos_y?: number;
  width?: number;
  height?: number;
  shape?: string;
  rotation?: number;
}

export const addOrUpdateTable = async (params: AddOrUpdateTableParams): Promise<unknown> => {
  const { data } = await api.post('/api/restaurant/tables/add-table', params);
  return data;
};

// ── INVOICES ────────────────────────────────────────────────────
export interface SearchInvoicesParams {
  search?: string;
  invoice_number?: string;
  client_name?: string;
  start_date?: string;
  end_date?: string;
  status_id?: number;
  location_id?: number;
  limit?: number;
  offset?: number;
}

export interface SearchInvoicesResult {
  invoices: InvoiceSearchResult[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export const searchInvoices = async (
  params: SearchInvoicesParams,
): Promise<SearchInvoicesResult> => {
  const limit = params.limit ?? 25;
  const offset = params.offset ?? 0;
  const { data } = await api.post<InvoiceSearchResponse | InvoiceSearchResult[]>(
    '/api/sales/search-invoices',
    { ...params, limit, offset },
  );

  if (Array.isArray(data)) {
    return {
      invoices: data,
      total: data.length,
      limit,
      offset,
      hasMore: false,
    };
  }
  const invoices = data.data ?? data.invoices ?? [];
  return {
    invoices,
    total: data.pagination?.total ?? data.total ?? invoices.length,
    limit: data.pagination?.limit ?? limit,
    offset: data.pagination?.offset ?? offset,
    hasMore: data.pagination?.hasMore ?? false,
  };
};

/**
 * Trae los items de una factura via get-full-account-details (POS).
 * El endpoint /api/sales/[id] está roto con 500 en este backend.
 */
interface FullAccountDetails {
  found: boolean;
  account?: Record<string, unknown>;
  orders?: Array<{
    id: number;
    details?: Array<{
      item_id?: number;
      item_name?: string;
      name?: string;
      item_sequence?: number;
      quantity?: number;
      order_price?: number;
      price?: number;
      total_price?: number;
      tax_amount?: number;
      discount_amount?: number;
      [key: string]: unknown;
    }>;
  }>;
}

export const fetchInvoiceItems = async (
  invoiceId: number,
): Promise<NonNullable<InvoiceSearchResult['items']>> => {
  const { data } = await api.post<FullAccountDetails>(
    '/api/restaurant/invoice/get-full-account-details',
    { invoice_id: invoiceId },
  );
  if (!data.found || !data.orders?.length) return [];
  const items: NonNullable<InvoiceSearchResult['items']> = [];
  data.orders.forEach((order) => {
    (order.details ?? []).forEach((d) => {
      const qty = Number(d.quantity ?? 0);
      const unit = Number(d.order_price ?? d.price ?? 0);
      const total = Number(d.total_price ?? qty * unit);
      items.push({
        id: d.item_id,
        item_id: d.item_id,
        item_name: String(d.item_name ?? d.name ?? '—'),
        quantity: qty,
        unit_price: unit,
        total_amount: total,
        tax_amount: Number(d.tax_amount ?? 0),
        discount_amount: Number(d.discount_amount ?? 0),
      });
    });
  });
  return items;
};
