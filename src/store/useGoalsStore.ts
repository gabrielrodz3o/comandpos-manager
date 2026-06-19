import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PeriodGoal {
  salesGoal: number;
  expenseBudget: number;
}

interface GoalsState {
  /** Metas por periodo, clave 'YYYY-MM'. */
  goals: Record<string, PeriodGoal>;
  setGoal: (period: string, goal: PeriodGoal) => void;
  clearGoal: (period: string) => void;
}

/** Clave de periodo 'YYYY-MM' a partir de una fecha ISO (o Date). */
export const periodKey = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set) => ({
      goals: {},
      setGoal: (period, goal) =>
        set((state) => ({ goals: { ...state.goals, [period]: goal } })),
      clearGoal: (period) =>
        set((state) => {
          const next = { ...state.goals };
          delete next[period];
          return { goals: next };
        }),
    }),
    {
      name: 'comandpos-goals',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
