import { create } from 'zustand';
import { isoDate, resolvePreset } from '@utils/dates';

interface FiltersState {
  startDate: string;
  endDate: string;
  /** Franja horaria opcional 'HH:mm' (24h). null = día completo. */
  startTime: string | null;
  endTime: string | null;
  activePresetDays: number | null;
  setRange: (start: string, end: string) => void;
  /** Rango personalizado con hora opcional (desde el RangePickerSheet). */
  setCustom: (
    start: string,
    end: string,
    startTime: string | null,
    endTime: string | null,
  ) => void;
  applyPreset: (days: number) => void;
  reset: () => void;
}

const today = new Date();
const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

export const useFiltersStore = create<FiltersState>((set) => ({
  startDate: isoDate(startOfMonth),
  endDate: isoDate(today),
  startTime: null,
  endTime: null,
  activePresetDays: -1, // "Mes" por defecto
  setRange: (startDate, endDate) =>
    set({ startDate, endDate, startTime: null, endTime: null, activePresetDays: null }),
  setCustom: (startDate, endDate, startTime, endTime) =>
    set({ startDate, endDate, startTime, endTime, activePresetDays: null }),
  applyPreset: (days) => {
    const { start, end } = resolvePreset(days);
    // Un preset siempre limpia la franja horaria.
    set({ startDate: start, endDate: end, startTime: null, endTime: null, activePresetDays: days });
  },
  reset: () => {
    const { start, end } = resolvePreset(-1);
    set({ startDate: start, endDate: end, startTime: null, endTime: null, activePresetDays: -1 });
  },
}));
