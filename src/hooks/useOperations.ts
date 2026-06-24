import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useBusinessStore } from '@store/useBusinessStore';
import { useFiltersStore } from '@store/useFiltersStore';
import {
  fetchWarehousesByLocation,
  fetchMultiWarehouseInventory,
  fetchBasicEmployees,
  fetchEmployeeDetail,
  fetchARSummary,
  fetchARAging,
  fetchShiftCalendar,
  fetchKardexGeneral,
} from '@services/operations';
import { useEffectiveLocationId } from './useEffectiveLocationId';
import { logger } from '@utils/logger';
import type { InventoryItem, KardexFilters, KardexSourceType } from '@/types/operations';

export const useWarehouses = () => {
  const eff = useEffectiveLocationId();
  const buId = useBusinessStore((s) => s.activeBusinessUnitId);

  const query = useQuery({
    queryKey: ['warehouses', eff.locationId],
    queryFn: () => {
      if (!eff.locationId) throw new Error('No location');
      return fetchWarehousesByLocation({
        locationId: eff.locationId,
        businessUnitId: buId ?? undefined,
      });
    },
    enabled: !!eff.locationId,
    staleTime: 5 * 60_000,
  });

  return { ...query, eff };
};

/**
 * Inventario multi-almacén.
 * Flatten: la API devuelve items con un array `warehouses[]` por cada uno.
 * Aquí lo aplanamos a 1 row por (item × warehouse) para mostrar lista plana.
 */
export const useInventory = (selectedWarehouseIds: number[] | null) => {
  const eff = useEffectiveLocationId();
  const buId = useBusinessStore((s) => s.activeBusinessUnitId);
  const warehousesQ = useWarehouses();

  // Si "Todos" → mandar TODOS los warehouse IDs (no null) para evitar el bug del backend
  const effectiveWarehouseIds = useMemo(() => {
    if (selectedWarehouseIds && selectedWarehouseIds.length > 0) {
      return selectedWarehouseIds;
    }
    return (warehousesQ.data ?? []).map((w) => w.id);
  }, [selectedWarehouseIds, warehousesQ.data]);

  const query = useQuery({
    queryKey: ['inventory', eff.locationId, effectiveWarehouseIds],
    queryFn: async () => {
      if (!eff.locationId) throw new Error('No location');
      if (effectiveWarehouseIds.length === 0) {
        return { data: [] as unknown[] };
      }
      logger.info('[inventory]', {
        locationId: eff.locationId,
        warehouseIds: effectiveWarehouseIds,
      });
      return fetchMultiWarehouseInventory({
        location_id: eff.locationId,
        warehouse_ids: effectiveWarehouseIds,
        business_unit_id: buId ?? null,
        catalogue_id: null,
      });
    },
    enabled: !!eff.locationId && effectiveWarehouseIds.length > 0,
    staleTime: 30_000,
    // El snapshot debe reflejar movimientos recientes al volver a la app.
    refetchOnWindowFocus: true,
  });

  // 1 fila por ITEM (no por warehouse). Agrega cantidades y elige el peor status.
  const items: InventoryItem[] = useMemo(() => {
    const raw = (query.data?.data ?? []) as Array<Record<string, unknown>>;
    return raw.map((item) => {
      const warehousesRaw = Array.isArray(item.warehouses)
        ? (item.warehouses as Array<Record<string, unknown>>)
        : [];
      // Dedup por warehouse_id (el backend puede devolver duplicados si hay múltiples
      // effective_dates u otras filas que se hayan agregado al json_agg).
      const dedupMap = new Map<number, InventoryItem['warehouses'][number]>();
      warehousesRaw.forEach((wh) => {
        const id = Number(wh.warehouse_id);
        if (!Number.isFinite(id)) return;
        // Si ya existe, sumamos quantity (más conservador que reemplazar)
        const existing = dedupMap.get(id);
        const next = {
          warehouse_id: id,
          warehouse_name: String(wh.warehouse_name ?? '—'),
          is_general: Boolean(wh.is_general),
          quantity: Number(wh.quantity ?? 0),
          min_quantity: wh.min_quantity == null ? null : Number(wh.min_quantity),
          max_quantity: wh.max_quantity == null ? null : Number(wh.max_quantity),
          reorder_point: wh.reorder_point == null ? null : Number(wh.reorder_point),
          reorder_quantity: wh.reorder_quantity == null ? null : Number(wh.reorder_quantity),
          stock_status: wh.stock_status as InventoryItem['stock_status'],
        };
        if (existing) {
          // Mantener la entrada más reciente (mismo quantity, mismo status)
          // — los json_agg duplicados típicamente tienen la misma quantity.
          dedupMap.set(id, next);
        } else {
          dedupMap.set(id, next);
        }
      });
      const warehouses = Array.from(dedupMap.values());

      const totalQty = warehouses.reduce((s, w) => s + w.quantity, 0);

      // Peor status entre todos los almacenes del item
      const order: Record<string, number> = {
        SIN_STOCK: 0,
        CRITICAL: 1,
        LOW: 2,
        NOT_CONFIGURED: 3,
        OK: 4,
        EXCESS: 5,
      };
      const worst =
        warehouses
          .map((w) => w.stock_status ?? 'NOT_CONFIGURED')
          .sort((a, b) => (order[a] ?? 99) - (order[b] ?? 99))[0] ?? 'NOT_CONFIGURED';

      return {
        item_id: Number(item.item_id),
        item_name: String(item.item_name ?? '—'),
        unit_quantity: Number(item.unit_quantity ?? 0),
        unit_name: item.unit_name as string,
        unit_abbreviation: item.unit_abbreviation as string,
        item_type_name: item.item_type_name as string,
        category_name: item.category_name as string,
        cost_price: Number(item.cost_price ?? 0),
        sale_price: Number(item.sale_price ?? 0),
        quantity: totalQty,
        warehouses,
        warehouses_count: warehouses.length,
        stock_status: worst as InventoryItem['stock_status'],
      };
    });
  }, [query.data]);

  return { ...query, eff, items };
};

export interface UseKardexArgs {
  start_date: string;
  end_date: string;
  source_type?: KardexSourceType | null;
  search?: string | null;
  warehouse_ids?: number[] | null;
  page?: number;
  limit?: number;
}

/**
 * Kardex / movimientos de inventario del rango seleccionado.
 * Con "Hoy" por defecto trae las transacciones del día. staleTime corto +
 * refetchOnWindowFocus para que las transacciones recién registradas aparezcan.
 */
export const useKardex = (args: UseKardexArgs) => {
  const eff = useEffectiveLocationId();
  const buId = useBusinessStore((s) => s.activeBusinessUnitId);

  const query = useQuery({
    queryKey: [
      'kardex',
      buId,
      eff.locationId,
      args.start_date,
      args.end_date,
      args.source_type ?? 'all',
      args.search ?? '',
      args.warehouse_ids ?? 'all',
      args.limit ?? 50,
    ],
    queryFn: () => {
      if (!buId) throw new Error('No business unit');
      const filters: KardexFilters = {
        business_unit_id: buId,
        location_id: eff.locationId ?? null,
        warehouse_ids: args.warehouse_ids ?? null,
        source_type: args.source_type ?? null,
        start_date: args.start_date,
        end_date: args.end_date,
        search: args.search ?? null,
        page: args.page ?? 1,
        limit: args.limit ?? 50,
      };
      logger.info('[kardex]', { buId, locationId: eff.locationId, ...args });
      return fetchKardexGeneral(filters);
    },
    enabled: !!buId && !!args.start_date && !!args.end_date,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

  return { ...query, eff };
};

export const useEmployeeDetail = (id: number | null) =>
  useQuery({
    queryKey: ['employee-detail', id],
    queryFn: () => {
      if (!id) throw new Error('No id');
      return fetchEmployeeDetail(id);
    },
    enabled: !!id,
    staleTime: 60_000,
  });

export const useEmployees = () => {
  const buId = useBusinessStore((s) => s.activeBusinessUnitId);
  const selectedLocationId = useBusinessStore((s) => s.selectedLocationId);

  return useQuery({
    queryKey: ['employees-basic', buId, selectedLocationId],
    queryFn: () => {
      if (!buId && !selectedLocationId) throw new Error('No location');
      logger.info('[employees-basic]', { buId, selectedLocationId });
      return fetchBasicEmployees({
        business_unit_id: buId ?? undefined,
        location_id: selectedLocationId ?? undefined,
      });
    },
    enabled: !!buId || !!selectedLocationId,
    staleTime: 30_000,
  });
};

export const useARSummary = () => {
  const eff = useEffectiveLocationId();
  const startDate = useFiltersStore((s) => s.startDate);
  const endDate = useFiltersStore((s) => s.endDate);

  const query = useQuery({
    queryKey: ['ar-summary', eff.locationId, startDate, endDate],
    queryFn: () => {
      if (!eff.locationId) throw new Error('No location');
      return fetchARSummary({
        location_id: eff.locationId,
        start_date: startDate,
        end_date: endDate,
      });
    },
    enabled: !!eff.locationId,
    staleTime: 60_000,
  });
  return { ...query, eff };
};

export const useShiftCalendar = (startDate: string, endDate: string) =>
  useQuery({
    queryKey: ['shift-calendar', startDate, endDate],
    queryFn: () => fetchShiftCalendar({ startDate, endDate }),
    enabled: !!startDate && !!endDate,
    staleTime: 60_000,
  });

export const useARAging = () => {
  const eff = useEffectiveLocationId();
  const startDate = useFiltersStore((s) => s.startDate);
  const endDate = useFiltersStore((s) => s.endDate);

  const query = useQuery({
    queryKey: ['ar-aging', eff.locationId, startDate, endDate],
    queryFn: () => {
      if (!eff.locationId) throw new Error('No location');
      return fetchARAging({
        location_id: eff.locationId,
        start_date: startDate,
        end_date: endDate,
      });
    },
    enabled: !!eff.locationId,
    staleTime: 60_000,
  });
  return { ...query, eff };
};
