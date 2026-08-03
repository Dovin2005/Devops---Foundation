import express from 'express';
import cors from 'cors';
import { applyBaseMiddleware } from '@ucc/service-kit';
import { requestId } from './utils/requestId.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { billingRoutes } from './routes/billing.routes.js';
import { internalBookingsRoutes } from './routes/internalBookings.routes.js';
import { stripeWebhookRoutes } from './routes/stripeWebhook.routes.js';
import { env } from './config/env.js';

export function createApp() {
  const app = express();
  applyBaseMiddleware(app); // gzip, no x-powered-by/etag
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  // Stripe webhook signature verification needs the exact raw body, so this
  // must be registered (and fully handle the response) before express.json().
  app.use('/api/billing/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhookRoutes);
  app.use(express.json({ limit: '2mb' }));
  app.use(requestId);

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'billing-service' }));
  // Internal first — /api/billing applies JWT auth to everything under it.
  app.use('/api/billing/internal/bookings', internalBookingsRoutes);
  app.use('/api/billing', billingRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
