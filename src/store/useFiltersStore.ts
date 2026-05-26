import { create } from 'zustand';
import { isoDate, resolvePreset } from '@utils/dates';

interface FiltersState {
  startDate: string;
  endDate: string;
  activePresetDays: number | null;
  setRange: (start: string, end: string) => void;
  applyPreset: (days: number) => void;
  reset: () => void;
}

const today = new Date();
const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

export const useFiltersStore = create<FiltersState>((set) => ({
  startDate: isoDate(startOfMonth),
  endDate: isoDate(today),
  activePresetDays: -1, // "Mes" por defecto
  setRange: (startDate, endDate) =>
    set({ startDate, endDate, activePresetDays: null }),
  applyPreset: (days) => {
    const { start, end } = resolvePreset(days);
    set({ startDate: start, endDate: end, activePresetDays: days });
  },
  reset: () => {
    const { start, end } = resolvePreset(-1);
    set({ startDate: start, endDate: end, activePresetDays: -1 });
  },
}));
