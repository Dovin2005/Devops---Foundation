import { assertNotDefaultInProd } from '@ucc/service-kit';

function parseSchema(url: string): string {
  const m = url.match(/[?&]schema=([^&]+)/);
  return m ? decodeURIComponent(m[1]!) : 'public';
}
const databaseUrl = process.env.DATABASE_URL ?? 'postgresql://ucc:ucc@localhost:5432/ucc?schema=billing';
const jwtSecret = process.env.JWT_SECRET ?? 'dev-change-me';
const internalSecret = process.env.INTERNAL_SERVICE_SECRET ?? 'dev-change-me-internal';
const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  assertNotDefaultInProd('JWT_SECRET', jwtSecret, 'dev-change-me');
  assertNotDefaultInProd('INTERNAL_SERVICE_SECRET', internalSecret, 'dev-change-me-internal');
}

export const env = {
  port: Number(process.env.PORT ?? 4004),
  databaseUrl,
  dbSchema: process.env.DB_SCHEMA ?? parseSchema(databaseUrl),
  jwtSecret,
  internalSecret,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? '', // empty = mock gateway
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '', // empty = signature verification skipped (dev/test)
  authUrl: process.env.AUTH_URL ?? 'http://localhost:4001',
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(','),
  poolSize: Number(process.env.DB_POOL_SIZE ?? 10),
  isProd,
  isTest: process.env.NODE_ENV === 'test',
};
