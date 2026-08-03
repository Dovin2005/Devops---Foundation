import express from 'express';
import cors from 'cors';
import { applyBaseMiddleware, send } from '@ucc/service-kit';
import { requestId } from './utils/requestId.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { otpRoutes } from './routes/otp.routes.js';
import { env } from './config/env.js';

const notImplemented = (_req: express.Request, res: express.Response) =>
  send(res, 501, { domain: 'messages, notifications (WhatsApp/email/push), video tokens' }, { message: 'notification-service: not implemented yet' });

export function createApp() {
  const app = express();
  applyBaseMiddleware(app); // gzip, no x-powered-by/etag
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  app.use(requestId);
  app.get('/health', (_req, res) => res.json({ ok: true, service: 'notification-service' }));
  app.use('/api/comms/internal/otp', otpRoutes);
  app.use('/api/notifications', notImplemented);
  app.use('/api/comms', notImplemented);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
