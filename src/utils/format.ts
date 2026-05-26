import type { BusinessUnitAccess, LocationInfo, ImageStorage } from '@/types/business';

export const fmtCurrency = (n: unknown, currency = 'DOP', maxDigits = 0): string => {
  const value = Number(n) || 0;
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency,
    maximumFractionDigits: maxDigits,
  }).format(value);
};

export const fmtCompact = (n: unknown): string => {
  const value = Number(n);
  if (Number.isNaN(value)) return String(n);
  return new Intl.NumberFormat('es-DO', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(value);
};

export const fmtInt = (n: unknown): string =>
  new Intl.NumberFormat('es-DO').format(Number(n) || 0);

export const fmtPct = (n: unknown, decimals = 1): string =>
  `${(Number(n) || 0).toFixed(decimals)}%`;

export const fmtDays = (n: unknown): string =>
  `${Math.round(Number(n) || 0)} días`;

/** Nombre legible de la unidad de negocio (con fallbacks). */
export const buName = (bu?: BusinessUnitAccess | null): string => {
  if (!bu) return '—';
  return (
    bu.business_unit_description_long ??
    bu.business_unit_description_short ??
    bu.business_unit_description ??
    bu.business_unit_name ??
    `Empresa #${bu.business_unit_id}`
  );
};

/** Nombre legible de la sucursal. */
export const locName = (loc?: LocationInfo | null): string => {
  if (!loc) return '—';
  return (
    loc.description_long?.trim() ||
    loc.description_short?.trim() ||
    loc.name ||
    `Sucursal ${loc.id}`
  );
};

const POCKETBASE_DEFAULT = 'https://pocketbase.gcoderd.com';

/** Construye la URL de un archivo en PocketBase. */
export const pbImageUrl = (
  storage?: ImageStorage | null,
  base: string = POCKETBASE_DEFAULT,
): string | null => {
  if (!storage?.collectionId || !storage?.id || !storage?.documents) return null;
  return `${base}/api/files/${storage.collectionId}/${storage.id}/${storage.documents}`;
};
