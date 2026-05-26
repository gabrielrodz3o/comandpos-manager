import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@store/useAuthStore';
import { logger } from '@utils/logger';

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
        logger.error('[api] ✗', normalized.status, normalized.message, error.config?.url);

        if (normalized.status === 401) {
          logger.warn('[api]', '401 received → logout');
          useAuthStore.getState().logout();
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
