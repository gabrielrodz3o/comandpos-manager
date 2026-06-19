import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useBusinessStore } from '@store/useBusinessStore';
import { fetchFinancialOverview } from '@services/dashboard';
import { fetchBoxesClosed } from '@services/reports/boxes';
import { useEffectiveLocationId } from './useEffectiveLocationId';
import { isoDate } from '@utils/dates';
import { logger } from '@utils/logger';
import { filterActiveLocations } from '@/types/business';

export type TodayRange = 'today' | '7d' | '30d';

const computeRange = (range: TodayRange): { start: string; end: string; label: string } => {
  const end = new Date();
  const start = new Date();
  if (range === 'today') {
    return { start: isoDate(start), end: isoDate(end), label: 'Hoy' };
  }
  if (range === '7d') {
    start.setDate(end.getDate() - 6);
    return { start: isoDate(start), end: isoDate(end), label: 'Últimos 7 días' };
  }
  start.setDate(end.getDate() - 29);
  return { start: isoDate(start), end: isoDate(end), label: 'Últimos 30 días' };
};

const previousRange = (range: TodayRange): { start: string; end: string } => {
  const end = new Date();
  const start = new Date();
  if (range === 'today') {
    start.setDate(end.getDate() - 1);
    end.setDate(end.getDate() - 1);
    return { start: isoDate(start), end: isoDate(end) };
  }
  if (range === '7d') {
    end.setDate(end.getDate() - 7);
    start.setDate(end.getDate() - 6);
    return { start: isoDate(start), end: isoDate(end) };
  }
  end.setDate(end.getDate() - 30);
  start.setDate(end.getDate() - 29);
  return { start: isoDate(start), end: isoDate(end) };
};

interface Body {
  business_unit_id: number;
  start_date: string;
  end_date: string;
  location_id?: number;
  location_ids?: number[];
}

const buildBody = (
  buId: number,
  start: string,
  end: string,
  selectedLocationId: number | null,
  activeLocations: number[],
): Body => {
  const body: Body = {
    business_unit_id: buId,
    start_date: start,
    end_date: end,
  };
  if (selectedLocationId) {
    body.location_id = selectedLocationId;
  } else if (activeLocations.length > 0) {
    body.location_ids = activeLocations;
  }
  return body;
};

/**
 * Snapshot para la pantalla Hoy con rango configurable.
 * Auto-refresh cada 60s.
 */
export const useTodaySnapshot = (
  range: TodayRange = 'today',
  opts?: { startTime?: string | null; endTime?: string | null },
) => {
  const buId = useBusinessStore((s) => s.activeBusinessUnitId);
  const selectedLocationId = useBusinessStore((s) => s.selectedLocationId);
  const activeBu = useBusinessStore((s) => s.activeBusinessUnit);
  const eff = useEffectiveLocationId();

  const startTime = opts?.startTime ?? null;
  const endTime = opts?.endTime ?? null;
  // Compone 'YYYY-MM-DD HH:mm:ss' si hay franja horaria; si no, fecha pura.
  const withStart = (date: string) => (startTime ? `${date} ${startTime}:00` : date);
  const withEnd = (date: string) => (endTime ? `${date} ${endTime}:59` : date);

  const current = computeRange(range);
  const previous = previousRange(range);

  const activeLocIds = filterActiveLocations(activeBu?.locations ?? []).map((l) => l.id);

  const currentQ = useQuery({
    queryKey: ['today-overview', buId, selectedLocationId, current.start, current.end, startTime, endTime],
    queryFn: async () => {
      if (!buId) throw new Error('No BU');
      const body = buildBody(buId, withStart(current.start), withEnd(current.end), selectedLocationId, activeLocIds);
      logger.info('[today-current]', body);
      const data = await fetchFinancialOverview(body);
      logger.info('[today-current]', 'result', {
        ventas: data?.summary?.ventas_total,
        facturas: data?.summary?.ventas_count,
      });
      return data;
    },
    enabled: !!buId,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const prevQ = useQuery({
    queryKey: ['today-prev', buId, selectedLocationId, previous.start, previous.end, startTime, endTime],
    queryFn: async () => {
      if (!buId) throw new Error('No BU');
      const body = buildBody(buId, withStart(previous.start), withEnd(previous.end), selectedLocationId, activeLocIds);
      return fetchFinancialOverview(body);
    },
    enabled: !!buId,
    staleTime: 5 * 60_000,
  });

  const boxesQ = useQuery({
    queryKey: ['today-boxes', eff.locationId, current.start, current.end],
    queryFn: () => {
      if (!eff.locationId) throw new Error('No location');
      return fetchBoxesClosed({
        location_id: eff.locationId,
        start_date: current.start,
        end_date: current.end,
      });
    },
    enabled: !!eff.locationId,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    return () => logger.debug('[today]', 'cleanup');
  }, []);

  const overview = currentQ.data;
  const s = overview?.summary;
  const prevS = prevQ.data?.summary;

  const summary = s
    ? {
        total_sales: Number(s.ventas_total ?? 0),
        num_facturas: Number(s.ventas_count ?? 0),
        avg_ticket:
          Number(s.ventas_count ?? 0) > 0
            ? Number(s.ventas_total ?? 0) / Number(s.ventas_count)
            : 0,
        total_tips: 0,
        total_profit: Number(s.utilidad_bruta ?? 0),
        total_items: 0,
        items_per_invoice: 0,
        total_cost: Number(s.costo_ventas ?? 0),
        total_discounts: 0,
      }
    : undefined;

  const prevSales = Number(prevS?.ventas_total ?? 0);
  const currentSales = Number(s?.ventas_total ?? 0);
  const deltaPct =
    prevSales > 0 ? ((currentSales - prevSales) / prevSales) * 100 : currentSales > 0 ? 100 : 0;

  return {
    summary,
    overview,
    prevSummary: prevS,
    deltaPct,
    prevSales,
    boxes: boxesQ.data ?? [],
    range,
    rangeLabel: current.label,
    today: current.end,
    startDate: current.start,
    endDate: current.end,
    isLoading: currentQ.isLoading,
    isFetching: currentQ.isFetching || boxesQ.isFetching,
    isRefetching: currentQ.isRefetching || boxesQ.isRefetching,
    error: currentQ.error,
    refetch: () => {
      currentQ.refetch();
      prevQ.refetch();
      boxesQ.refetch();
    },
    locationName: eff.location
      ? eff.location.description_long ?? eff.location.description_short
      : null,
  };
};
