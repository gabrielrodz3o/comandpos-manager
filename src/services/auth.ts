import { api } from './apiClient';
import { logger } from '@utils/logger';
import type { AuthUser } from '@/types/business';

interface LoginPayload {
  username: string;
  password: string;
  rememberMe?: boolean;
  location_id?: number;
}

interface LoginResponse {
  user: AuthUser;
  token: string;
}

export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  logger.info('[auth.login]', 'request', { username: payload.username });
  const { data } = await api.post<LoginResponse>('/auth/login', {
    rememberMe: true, // siempre solicitar token de larga duración
    ...payload,
  });
  logger.info('[auth.login]', 'response user keys:', Object.keys(data.user ?? {}));
  logger.debug('[auth.login]', 'business_units_with_access:', JSON.stringify(data.user?.business_units_with_access, null, 2));
  return data;
};

/**
 * Verifica el estado actual del usuario contra el backend.
 * Devuelve el user fresco con use_sta_id actualizado.
 */
export const me = async (): Promise<AuthUser> => {
  const { data } = await api.get<{ user: AuthUser } | AuthUser>('/auth/me');
  return (data as { user?: AuthUser }).user ?? (data as AuthUser);
};

export const logout = async (): Promise<void> => {
  try {
    await api.post('/auth/logout');
  } catch {
    // backend puede no tener este endpoint — no es crítico
  }
};
