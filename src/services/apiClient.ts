import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@store/useAuthStore';
import { showToast } from '@store/useToastStore';
import { logger } from '@utils/logger';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Si es true, el interceptor no muestra toast de error (el llamador lo maneja). */
    skipErrorToast?: boolean;
  }
}

interface NormalizedError {
  message: string;
  status?: number;
  raw?: unknown;
}

const normalizeError = (error: AxiosError): NormalizedError => {
  if (error.response) {
    const data = error.response.data as {
      message?: string;
      statusMessage?: string;
      data?: string | { message?: string };
    };
    // Nuxt h3 createError pone el detalle en `data.data` (puede ser string o objeto)
    const nestedDetail =
      typeof data?.data === 'string'
        ? data.data
        : data?.data && typeof data.data === 'object'
        ? data.data.message
        : undefined;
    const baseMsg =
      data?.message || data?.statusMessage || `Error ${error.response.status}`;
    const message = nestedDetail ? `${baseMsg} — ${nestedDetail}` : baseMsg;
    return {
      message,
      status: error.response.status,
      raw: error.response.data,
    };
  }
  if (error.request) {
    return { message: 'Sin conexión con el servidor. Verifica tu internet.', raw: error.request };
  }
  return { message: error.message || 'Error desconocido', raw: error };
};

class ApiClient {
  private static instance: AxiosInstance | null = null;

  static getInstance(): AxiosInstance {
    if (!this.instance) {
      this.instance = this.createInstance();
    }
    return this.instance;
  }

  static reset() {
    this.instance = null;
  }

  private static createInstance(): AxiosInstance {
    const { apiBaseUrl } = useAuthStore.getState();
    logger.info('[api]', 'Creating axios instance with baseURL:', apiBaseUrl);

    const instance = axios.create({
      baseURL: apiBaseUrl ?? '',
      timeout: 20_000,
      headers: { 'Content-Type': 'application/json' },
    });

    instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = useAuthStore.getState().token;
        if (token) {
          config.headers.set('Authorization', `Bearer ${token}`);
        }
        const currentBase = useAuthStore.getState().apiBaseUrl;
        if (currentBase) {
          config.baseURL = currentBase;
        }
        logger.debug('[api] →', config.method?.toUpperCase(), config.url, config.data ?? '');
        return config;
      },
      (error) => {
        logger.error('[api] req err', error);
        return Promise.reject(error);
      },
    );

    instance.interceptors.response.use(
      (res) => {
        logger.debug('[api] ←', res.status, res.config.url);
        return res;
      },
      (error: AxiosError) => {
        const normalized = normalizeError(error);

        const hadSession = !!useAuthStore.getState().token;
        const isTimeout = error.code === 'ECONNABORTED';
        const isNetwork = !error.response && !!error.request;
        const isSessionExpired = normalized.status === 401 && hadSession;
        // Requests con manejo propio de error (p.ej. fallback) pueden silenciar el toast.
        const skipToast = error.config?.skipErrorToast;

        // Las requests que manejan su propio error se registran como debug, no como error.
        if (skipToast) {
          logger.debug('[api] ✗ (manejado)', normalized.status, normalized.message, error.config?.url);
        } else {
          logger.error('[api] ✗', normalized.status, normalized.message, error.config?.url);
        }

        // El logout en 401 ocurre siempre, sin importar el toast.
        // (Un 401 en el login sin sesión activa lo maneja la pantalla.)
        if (isSessionExpired) {
          logger.warn('[api]', '401 received → logout');
          useAuthStore.getState().logout();
        }

        if (!skipToast) {
          if (isTimeout) {
            showToast({ message: 'La conexión tardó demasiado. Intenta de nuevo.', variant: 'warning' });
          } else if (isNetwork) {
            showToast({ message: 'Sin conexión con el servidor. Verifica tu internet.', variant: 'error' });
          } else if (isSessionExpired) {
            showToast({ message: 'Tu sesión expiró. Inicia sesión de nuevo.', variant: 'warning' });
          } else if (normalized.status && normalized.status >= 500) {
            showToast({ message: 'Error del servidor. Intenta más tarde.', variant: 'error' });
          }
        }

        (error as AxiosError & { normalized?: NormalizedError }).normalized = normalized;
        return Promise.reject(error);
      },
    );

    return instance;
  }
}

export const api = ApiClient.getInstance();
export { ApiClient, normalizeError, type NormalizedError };
