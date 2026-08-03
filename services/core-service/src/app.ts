import express from 'express';
import cors from 'cors';
import { applyBaseMiddleware } from '@ucc/service-kit';
import { requestId } from './utils/requestId.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { providersRoutes } from './routes/providers.routes.js';
import { bookingsRoutes } from './routes/bookings.routes.js';
import { casesRoutes } from './routes/cases.routes.js';
import { patientsRoutes } from './routes/patients.routes.js';
import { internalAdminRoutes } from './routes/internalAdmin.routes.js';
import { env } from './config/env.js';

export function createApp() {
  const app = express();
  applyBaseMiddleware(app); // gzip, no x-powered-by/etag
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  app.use(requestId);

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'core-service' }));
  // Kong routes both /api/scheduling and /api/patients here.
  app.use('/api/scheduling', providersRoutes);
  app.use('/api/scheduling', bookingsRoutes);
  app.use('/api/scheduling', casesRoutes);
  app.use('/api/patients', patientsRoutes);
  app.use('/api/core/internal/admin', internalAdminRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
