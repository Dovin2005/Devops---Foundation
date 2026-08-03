import { assertNotDefaultInProd } from '@ucc/service-kit';

function parseSchema(url: string): string {
  const m = url.match(/[?&]schema=([^&]+)/);
  return m ? decodeURIComponent(m[1]!) : 'public';
}

const databaseUrl = process.env.DATABASE_URL ?? 'postgresql://ucc:ucc@localhost:5432/ucc?schema=auth';
const jwtSecret = process.env.JWT_SECRET ?? 'dev-change-me';
const internalSecret = process.env.INTERNAL_SERVICE_SECRET ?? 'dev-change-me-internal';
const encryptionMasterKey = process.env.ENCRYPTION_MASTER_KEY ?? 'dev-change-me-encryption-key';
const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  assertNotDefaultInProd('JWT_SECRET', jwtSecret, 'dev-change-me');
  assertNotDefaultInProd('INTERNAL_SERVICE_SECRET', internalSecret, 'dev-change-me-internal');
  assertNotDefaultInProd('ENCRYPTION_MASTER_KEY', encryptionMasterKey, 'dev-change-me-encryption-key');
}

export const env = {
  port: Number(process.env.PORT ?? 4001),
  databaseUrl,
  dbSchema: process.env.DB_SCHEMA ?? parseSchema(databaseUrl),
  jwtSecret,
  internalSecret,
  encryptionMasterKey,
  coreUrl: process.env.CORE_URL ?? 'http://localhost:4002',
  commsUrl: process.env.COMMS_URL ?? 'http://localhost:4008',
  accessTtl: process.env.ACCESS_TTL ?? '15m',
  refreshTtl: process.env.REFRESH_TTL ?? '7d',
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(','),
  poolSize: Number(process.env.DB_POOL_SIZE ?? 10),
  isProd,
  isTest: process.env.NODE_ENV === 'test',
};
