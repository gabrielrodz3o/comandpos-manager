import * as Sentry from '@sentry/react-native';
import { logger } from '@utils/logger';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

/**
 * Inicializa Sentry para error tracking.
 * Solo se activa si EXPO_PUBLIC_SENTRY_DSN está configurado.
 */
export const initSentry = (): void => {
  if (!SENTRY_DSN) {
    logger.info('[sentry]', 'DSN not configured — error tracking disabled');
    return;
  }
  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      debug: __DEV__,
      tracesSampleRate: 0.2,
      attachScreenshot: true,
      attachViewHierarchy: true,
    });
    logger.info('[sentry]', 'initialized');
  } catch (e) {
    logger.warn('[sentry]', 'init failed', e);
  }
};

export const captureException = (error: unknown, context?: Record<string, unknown>): void => {
  if (!SENTRY_DSN) return;
  try {
    Sentry.captureException(error, { extra: context });
  } catch {
    // swallow
  }
};

export const setUser = (user: { id: string; username?: string; email?: string } | null): void => {
  if (!SENTRY_DSN) return;
  try {
    Sentry.setUser(user);
  } catch {
    // swallow
  }
};
