export interface ImageStorage {
  id: string;
  documents: string;
  collectionId: string;
  collectionName?: string;
  created?: string;
  updated?: string;
}

export interface LocationInfo {
  id: number;
  business_unit_id?: number;
  description_short?: string;
  description_long?: string;
  name?: string;
  code?: string;
  status_id?: number;
  address?: string;
  phone?: string;
  email?: string;
  rnl?: string;
}

export interface BusinessUnitAccess {
  business_unit_id: number;
  company_id?: number;
  rnc?: string;
  business_unit_description_short?: string;
  business_unit_description_long?: string;
  business_unit_description?: string;
  business_unit_name?: string;
  business_unit_status?: number;
  business_unit_address?: string;
  business_unit_image_storage?: ImageStorage | null;
  business_unit_use_nfc?: boolean;
  currency_id?: number;
  locations: LocationInfo[];
}

export interface AccessProfile {
  type_access: number;
  type_description: string;
  access_profile_id: number;
  access_profile_description: string;
}

export interface UserProfileAssignment {
  id: number;
  profile_id: number;
  profile_description: string;
  location_id?: number | null;
  is_primary?: boolean;
  valid_from?: string;
  valid_until?: string | null;
}

export interface AuthUser {
  use_id: number;
  use_dep_id?: number;
  dep_description?: string;
  use_per_id?: number;
  per_level?: number;
  per_description?: string;
  use_com_id?: number;
  use_sta_id?: number;
  com_description?: string;
  use_fullname?: string;
  use_username?: string;
  use_email?: string;
  use_image?: string;
  use_bra_id?: number;
  bra_description?: string;
  image_storage?: string | null;
  pin?: string;
  // Compatibilidad
  username?: string;
  email?: string;
  // Permisos
  acess_finance?: number[];
  acess_locations?: number[];
  type_access?: Array<{ access: AccessProfile }>;
  user_profiles?: UserProfileAssignment[];
  // Acceso a unidades de negocio
  business_units_with_access?: BusinessUnitAccess[];
  [key: string]: unknown;
}

// ─────────────────────────────────────────────────────────────────
// Helpers de autorización
// ─────────────────────────────────────────────────────────────────
//
// IMPORTANTE: la app de Manager solo permite usuarios con perfil de acceso
// MASTER en el POS. Los campos `per_description` y `per_level` corresponden
// al módulo HR (Gestión Humana), NO al perfil operativo del POS. Un usuario
// puede ser "ADMINISTRADOR" en HR (per_level 1) pero "CAJERO" en el POS
// — en ese caso NO debe acceder a esta app.
//
// La fuente de verdad es:
//   user.type_access[].access.access_profile_id  ===  28  (MASTER)
//   user.type_access[].access.access_profile_description === 'MASTER'
//   o user.user_profiles[].profile_description === 'MASTER'

/** Profile IDs que permiten acceso a la app gerencial (POS). */
const MANAGER_PROFILE_IDS = new Set([28]); // MASTER

/** Solo descripciones de profile POS que permiten acceso. */
const MANAGER_PROFILE_DESCRIPTIONS = new Set(['MASTER']);

/**
 * Verifica si un usuario tiene permisos para usar la app de Manager.
 * Reglas estrictas:
 * - Debe estar activo (use_sta_id === 1)
 * - Debe tener un profile POS = MASTER en `type_access` o `user_profiles`
 *
 * NO se usa `per_description` ni `per_level` porque corresponden al módulo HR,
 * no al rol operativo del POS.
 */
export const userCanAccessManager = (user?: AuthUser | null): {
  ok: boolean;
  reason?: string;
} => {
  if (!user) return { ok: false, reason: 'Sesión no válida' };

  // Usuario inactivo
  if (user.use_sta_id != null && user.use_sta_id !== 1) {
    return { ok: false, reason: 'Tu usuario está inactivo. Contacta al administrador.' };
  }

  // Profile-based check estricto
  const profilesFromTypeAccess =
    user.type_access?.map((t) => t.access?.access_profile_description) ?? [];
  const profilesFromUserProfiles =
    user.user_profiles?.map((p) => p.profile_description) ?? [];
  const profileIdsFromTypeAccess =
    user.type_access?.map((t) => t.access?.access_profile_id) ?? [];
  const profileIdsFromUserProfiles =
    user.user_profiles?.map((p) => p.profile_id) ?? [];

  const allProfileNames = [...profilesFromTypeAccess, ...profilesFromUserProfiles]
    .filter(Boolean)
    .map((p) => String(p).toUpperCase().trim());
  const allProfileIds = [...profileIdsFromTypeAccess, ...profileIdsFromUserProfiles].filter(
    (v): v is number => v != null,
  );

  const hasManagerProfile =
    allProfileNames.some((p) => MANAGER_PROFILE_DESCRIPTIONS.has(p)) ||
    allProfileIds.some((id) => MANAGER_PROFILE_IDS.has(id));

  if (!hasManagerProfile) {
    return {
      ok: false,
      reason:
        'Esta app es exclusiva para usuarios con perfil MASTER en el POS. Tu perfil actual no tiene los permisos necesarios.',
    };
  }

  return { ok: true };
};

/** Filtra solo las sucursales activas (status_id === 1). */
export const filterActiveLocations = (locations: LocationInfo[]): LocationInfo[] =>
  (locations ?? []).filter((l) => l.status_id == null || l.status_id === 1);
