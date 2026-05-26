type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDev = __DEV__;

const COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m',  // cyan
  info:  '\x1b[32m',  // green
  warn:  '\x1b[33m',  // yellow
  error: '\x1b[31m',  // red
};
const RESET = '\x1b[0m';

const log = (level: LogLevel, scope: string, ...args: unknown[]) => {
  if (!isDev && level === 'debug') return;
  const tag = `${COLORS[level]}[${level.toUpperCase()}]${RESET} ${scope}`;
  // eslint-disable-next-line no-console
  console[level === 'debug' ? 'log' : level](tag, ...args);
};

export const logger = {
  debug: (scope: string, ...args: unknown[]) => log('debug', scope, ...args),
  info:  (scope: string, ...args: unknown[]) => log('info', scope, ...args),
  warn:  (scope: string, ...args: unknown[]) => log('warn', scope, ...args),
  error: (scope: string, ...args: unknown[]) => log('error', scope, ...args),
};
