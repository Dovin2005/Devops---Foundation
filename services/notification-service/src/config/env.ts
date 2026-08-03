function parseSchema(url: string): string {
  const m = url.match(/[?&]schema=([^&]+)/);
  return m ? decodeURIComponent(m[1]!) : 'public';
}
const databaseUrl = process.env.DATABASE_URL ?? 'postgresql://ucc:ucc@localhost:5432/ucc?schema=comms';
export const env = {
  port: Number(process.env.PORT ?? 4008),
  databaseUrl,
  dbSchema: process.env.DB_SCHEMA ?? parseSchema(databaseUrl),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-change-me',
  internalSecret: process.env.INTERNAL_SERVICE_SECRET ?? 'dev-change-me-internal',
  authUrl: process.env.AUTH_URL ?? 'http://localhost:4001',
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(','),
  poolSize: Number(process.env.DB_POOL_SIZE ?? 10),
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};
