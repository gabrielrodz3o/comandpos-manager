/**
 * Devuelve YYYY-MM-DD en hora LOCAL (no UTC).
 *
 * BUG arreglado: `toISOString()` convierte a UTC, lo que en zonas con offset
 * negativo (RD = UTC-4) hacía que en horas tarde-noche se enviara la fecha
 * de mañana al backend, devolviendo 0 ventas.
 *
 * Ej. 10pm del 26-may en RD (UTC-4) = 02:00 UTC del 27. `toISOString` →
 * '2026-05-27', cuando el usuario espera '2026-05-26'.
 */
export const isoDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export interface DatePreset {
  key: string;
  label: string;
  icon: string;
  days: number; // -1 = mes actual, -2 = año actual, otherwise N days back
}

export const datePresets: DatePreset[] = [
  { key: 'today',    label: 'Hoy',        icon: 'calendar-today',     days: 0 },
  { key: '7d',       label: '7 días',     icon: 'calendar-week',      days: 6 },
  { key: 'month',    label: 'Mes',        icon: 'calendar-month',     days: -1 },
  { key: '30d',      label: '30 días',    icon: 'calendar-range',     days: 29 },
  { key: '90d',      label: '90 días',    icon: 'calendar-multiselect', days: 89 },
  { key: 'year',     label: 'Año',        icon: 'calendar-star',      days: -2 },
];

export const resolvePreset = (days: number): { start: string; end: string } => {
  const end = new Date();
  let start = new Date();
  if (days === -1) {
    start = new Date(end.getFullYear(), end.getMonth(), 1);
  } else if (days === -2) {
    start = new Date(end.getFullYear(), 0, 1);
  } else {
    start.setDate(end.getDate() - days);
  }
  return { start: isoDate(start), end: isoDate(end) };
};

export const rangeSpanDays = (start: string, end: string): number => {
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  return Math.max(1, Math.floor((b - a) / 86_400_000) + 1);
};
