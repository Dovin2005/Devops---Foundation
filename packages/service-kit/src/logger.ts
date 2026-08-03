import pino from 'pino';

// Structured logs, no PII. Level via LOG_LEVEL; pretty in dev.
export function createLogger(service: string) {
  return pino({
    name: service,
    level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    redact: {
      paths: ['req.headers.authorization', '*.password', '*.passwordHash', '*.token', '*.refreshToken'],
      remove: true,
    },
  });
}

export type Logger = ReturnType<typeof createLogger>;
