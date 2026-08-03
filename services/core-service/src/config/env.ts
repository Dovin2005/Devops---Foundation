function parseSchema(url: string): string {
  const m = url.match(/[?&]schema=([^&]+)/);
  return m ? decodeURIComponent(m[1]!) : 'public';
}
const databaseUrl = process.env.DATABASE_URL ?? 'postgresql://ucc:ucc@localhost:5432/ucc?schema=core';
export const env = {
  port: Number(process.env.PORT ?? 4002),
  databaseUrl,
  dbSchema: process.env.DB_SCHEMA ?? parseSchema(databaseUrl),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-change-me',
  internalSecret: process.env.INTERNAL_SERVICE_SECRET ?? 'dev-change-me-internal',
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(','),
  authUrl: process.env.AUTH_URL ?? 'http://localhost:4001', // inter-service calls (coordinator roster)
  billingUrl: process.env.BILLING_URL ?? 'http://localhost:4004', // booking payments (Stripe pre-auth)
  poolSize: Number(process.env.DB_POOL_SIZE ?? 10),
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};
