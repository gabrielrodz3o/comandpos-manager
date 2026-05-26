import { useMemo } from 'react';
import { useBusinessStore } from '@store/useBusinessStore';
import { useFiltersStore } from '@store/useFiltersStore';
import { logger } from '@utils/logger';
import type { ReportQueryBody } from '@/types/api';

const EMPTY: never[] = [];

/**
 * Construye el body común para todos los endpoints de reportes.
 * - Si hay una location seleccionada → envía `location_id`.
 * - Si no (consolidado) → envía `location_ids` con todas las activas.
 */
export const useReportBody = (): ReportQueryBody | null => {
  const buId = useBusinessStore((s) => s.activeBusinessUnitId);
  const selectedLocationId = useBusinessStore((s) => s.selectedLocationId);
  const activeBu = useBusinessStore((s) => s.activeBusinessUnit);
  const startDate = useFiltersStore((s) => s.startDate);
  const endDate = useFiltersStore((s) => s.endDate);

  return useMemo(() => {
    if (!buId) {
      logger.warn('[reportBody]', 'No business_unit_id active');
      return null;
    }
    const body: ReportQueryBody = {
      business_unit_id: buId,
      start_date: startDate,
      end_date: endDate,
    };
    const locations = activeBu?.locations ?? EMPTY;
    if (selectedLocationId) {
      body.location_id = selectedLocationId;
    } else if (locations.length > 0) {
      body.location_ids = locations
        .filter((l) => l.status_id == null || l.status_id === 1)
        .map((l) => l.id);
    }
    logger.debug('[reportBody]', body);
    return body;
  }, [buId, startDate, endDate, selectedLocationId, activeBu]);
};
