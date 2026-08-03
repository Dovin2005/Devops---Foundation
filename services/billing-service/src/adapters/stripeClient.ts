import Stripe from 'stripe';
import { env } from '../config/env.js';

// Shared Stripe SDK client for all adapters (gateway, customers). Without
// STRIPE_SECRET_KEY every adapter falls back to a deterministic mock so
// local/dev/test flows work end to end.
export const stripe = env.stripeSecretKey ? new Stripe(env.stripeSecretKey) : null;
export const stripeEnabled = Boolean(stripe);
