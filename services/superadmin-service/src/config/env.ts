export const env = {
  port: Number(process.env.PORT ?? 4007),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-change-me',
  internalSecret: process.env.INTERNAL_SERVICE_SECRET ?? 'dev-change-me-internal',
  authUrl: process.env.AUTH_URL ?? 'http://localhost:4001',
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(','),
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};
