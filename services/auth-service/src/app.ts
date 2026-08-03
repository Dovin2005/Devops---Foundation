import express from 'express';
import cors from 'cors';
import { applyBaseMiddleware } from '@ucc/service-kit';
import { requestId } from './utils/requestId.js';
import { authRoutes } from './routes/auth.routes.js';
import { internalAdminRoutes } from './routes/internalAdmin.routes.js';
import { internalUsersRoutes } from './routes/internalUsers.routes.js';
import { internalContentRoutes } from './routes/internalContent.routes.js';
import { publicContentRoutes } from './routes/publicContent.routes.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { env } from './config/env.js';

export function createApp() {
  const app = express();
  applyBaseMiddleware(app); // gzip, no x-powered-by/etag
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(requestId);

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'auth-service' }));
  app.use('/api/auth/public', publicContentRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/auth/internal/admin', internalAdminRoutes);
  app.use('/api/auth/internal/users', internalUsersRoutes);
  app.use('/api/auth/internal/content', internalContentRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
