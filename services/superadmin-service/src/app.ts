import express from 'express';
import cors from 'cors';
import { applyBaseMiddleware } from '@ucc/service-kit';
import { requestId } from './utils/requestId.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { adminRoutes } from './routes/admin.routes.js';
import { env } from './config/env.js';

export function createApp() {
  const app = express();
  applyBaseMiddleware(app); // gzip, no x-powered-by/etag
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  app.use(requestId);
  app.get('/health', (_req, res) => res.json({ ok: true, service: 'superadmin-service' }));
  app.use('/api/admin', adminRoutes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
