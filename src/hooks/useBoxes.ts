import { useQuery } from '@tanstack/react-query';
import { useFiltersStore } from '@store/useFiltersStore';
import {
  fetchBoxesClosed,
  fetchBoxEntryDetail,
  fetchBoxInvoices,
  fetchBoxSalesDay,
  fetchBoxDenominations,
} from '@services/reports/boxes';
import { useEffectiveLocationId } from './useEffectiveLocationId';
import { logger } from '@utils/logger';

export const useBoxesList = () => {
  const eff = useEffectiveLocationId();
  const startDate = useFiltersStore((s) => s.startDate);
  const endDate = useFiltersStore((s) => s.endDate);

  const query = useQuery({
    queryKey: ['boxes-closed', eff.locationId, startDate, endDate],
    queryFn: () => {
      if (!eff.locationId) throw new Error('No location');
      logger.info('[boxes-list]', { locationId: eff.locationId, startDate, endDate });
      return fetchBoxesClosed({
        location_id: eff.locationId,
        start_date: startDate,
        end_date: endDate,
      });
    },
    enabled: !!eff.locationId,
    staleTime: 30_000,
  });

  return { ...query, eff };
};

export const useBoxEntryDetail = (box_entry_id: number | null) =>
  useQuery({
    queryKey: ['box-entry-detail', box_entry_id],
    queryFn: () => {
      if (!box_entry_id) throw new Error('No box id');
      return fetchBoxEntryDetail(box_entry_id);
    },
    enabled: !!box_entry_id,
    staleTime: 30_000,
  });

export const useBoxInvoices = (box_entry_id: number | null) =>
  useQuery({
    queryKey: ['box-invoices', box_entry_id],
    queryFn: () => {
      if (!box_entry_id) throw new Error('No box id');
      return fetchBoxInvoices(box_entry_id);
    },
    enabled: !!box_entry_id,
    staleTime: 30_000,
  });

export const useBoxSalesDay = (box_entry_id: number | null) =>
  useQuery({
    queryKey: ['box-sales-day', box_entry_id],
    queryFn: () => {
      if (!box_entry_id) throw new Error('No box id');
      return fetchBoxSalesDay(box_entry_id);
    },
    enabled: !!box_entry_id,
    staleTime: 30_000,
  });

export const useBoxDenominations = (box_entry_id: number | null) =>
  useQuery({
    queryKey: ['box-denominations', box_entry_id],
    queryFn: () => {
      if (!box_entry_id) throw new Error('No box id');
      return fetchBoxDenominations(box_entry_id);
    },
    enabled: !!box_entry_id,
    staleTime: 60_000,
  });
