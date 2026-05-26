/**
 * Paleta "delicate white" — estética minimalista, premium.
 * Inspiración: Linear (light), Stripe Dashboard, Notion, Apple.
 *
 * NOTA: el namespace se llama `dark` por compatibilidad con imports previos,
 * pero los valores representan el tema claro activo de la app.
 */
export const palette = {
  dark: {
    // Fondos
    bg: '#FAFAFA',          // base — gris cálido muy claro
    surface: '#FFFFFF',     // cards — blanco puro
    elevated: '#FFFFFF',    // cards elevados (se diferencia por shadow, no color)
    soft: '#F5F5F7',        // chips inactivos, dividers de bloque

    // Bordes
    border: '#ECECEE',      // bordes hairline
    borderHi: '#E2E2E6',    // separadores ligeramente más visibles

    // Texto
    text: '#0A0A0B',        // headings — casi negro
    textDim: '#5C5C66',     // body / dimmed
    textMuted: '#9B9BA3',   // hints / captions

    // Marca
    primary: '#10B981',     // emerald-500 — accent principal
    primaryHi: '#34D399',
    primaryDim: '#D1FAE5',  // fondo tonal suave para chips de marca

    // Semánticos
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',

    // Overlays
    overlay: 'rgba(15, 23, 42, 0.45)',
    backdrop: 'rgba(245, 245, 247, 0.8)',
  },
  light: {
    bg: '#FAFAFA',
    surface: '#FFFFFF',
    elevated: '#FFFFFF',
    soft: '#F5F5F7',
    border: '#ECECEE',
    borderHi: '#E2E2E6',
    text: '#0A0A0B',
    textDim: '#5C5C66',
    textMuted: '#9B9BA3',
    primary: '#10B981',
    primaryHi: '#34D399',
    primaryDim: '#D1FAE5',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
    overlay: 'rgba(15, 23, 42, 0.45)',
    backdrop: 'rgba(245, 245, 247, 0.8)',
  },
} as const;

/** Paleta de gráficos refinada — tonos saturados pero balanceados sobre fondo claro. */
export const chartPalette = [
  '#10B981', // emerald — marca
  '#6366F1', // indigo
  '#F59E0B', // amber
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#8B5CF6', // violet
  '#F97316', // orange
  '#14B8A6', // teal
  '#A855F7', // purple
  '#84CC16', // lime
] as const;

/** Tokens de sombra — delicadas, casi imperceptibles. */
export const shadow = {
  none:   { shadowColor: '#000', shadowOpacity: 0,    shadowOffset: { width: 0, height: 0 }, shadowRadius: 0,  elevation: 0 },
  sm:     { shadowColor: '#0A0A0B', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 1 }, shadowRadius: 2,  elevation: 1 },
  md:     { shadowColor: '#0A0A0B', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8,  elevation: 2 },
  lg:     { shadowColor: '#0A0A0B', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 6 }, shadowRadius: 18, elevation: 4 },
  hero:   { shadowColor: '#10B981', shadowOpacity: 0.18, shadowOffset: { width: 0, height: 12 }, shadowRadius: 24, elevation: 8 },
} as const;

export type ThemeMode = 'dark' | 'light';
export type ThemeColors = typeof palette.dark;
