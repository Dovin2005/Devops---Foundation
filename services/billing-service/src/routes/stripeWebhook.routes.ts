import { Router } from 'express';
import type Stripe from 'stripe';
import { HttpError, ah, ok } from '@ucc/service-kit';
import { stripe } from '../adapters/stripeClient.js';
import { env } from '../config/env.js';
import { stripeWebhookService } from '../services/stripeWebhook.service.js';

// Stripe → billing-service. Mounted in app.ts with express.raw() (before the
// global express.json()) — signature verification needs the exact raw body.
// Not reachable via a user JWT or the internal shared secret; Stripe signs
// each request with STRIPE_WEBHOOK_SECRET instead. Excluded from Kong's jwt
// plugin (see apigateway-service/kong.yml billing-webhooks-public route).
export const stripeWebhookRoutes = Router();

stripeWebhookRoutes.post('/', ah(async (req, res) => {
  let event: Stripe.Event;
  if (stripe && env.stripeWebhookSecret) {
    const signature = req.headers['stripe-signature'];
    if (!signature) throw new HttpError(400, 'Missing stripe-signature header');
    try {
      event = stripe.webhooks.constructEvent(req.body as Buffer, signature, env.stripeWebhookSecret);
    } catch {
      throw new HttpError(400, 'Webhook signature verification failed');
    }
  } else {
    // Mock/dev mode: no signing secret configured — trust the parsed payload
    // so local Stripe CLI / Postman flows keep working.
    event = JSON.parse((req.body as Buffer).toString('utf8')) as Stripe.Event;
  }
  await stripeWebhookService.handle(event);
  ok(res, { received: true });
}));
