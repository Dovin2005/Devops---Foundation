import crypto from 'node:crypto';
import type Stripe from 'stripe';
import { stripe } from './stripeClient.js';
import { asHttpError } from './stripeErrors.js';

// Stripe Customers + reusable PaymentMethods (saved cards). Mirrors
// stripeGateway.ts's mock fallback so local/dev/test flows work without
// STRIPE_SECRET_KEY.

export interface CardDetails {
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
}

const mockId = (p: string) => `${p}_mock_${crypto.randomBytes(8).toString('hex')}`;

function cardDetails(pm: Stripe.PaymentMethod): CardDetails {
  const card = pm.card;
  return {
    brand: card?.brand ?? null,
    last4: card?.last4 ?? null,
    expMonth: card?.exp_month ?? null,
    expYear: card?.exp_year ?? null,
  };
}

export const stripeCustomers = {
  async create(input: { email?: string | null; name?: string | null; metadata?: Record<string, string> }): Promise<string> {
    if (!stripe) return mockId('cus');
    try {
      const customer = await stripe.customers.create({
        email: input.email ?? undefined,
        name: input.name ?? undefined,
        metadata: input.metadata,
      });
      return customer.id;
    } catch (e) {
      asHttpError(e);
    }
  },

  // Attaches a client-tokenized PaymentMethod to the customer and returns its
  // non-sensitive card details for local storage.
  async attachPaymentMethod(customerId: string, paymentMethodId: string): Promise<CardDetails> {
    if (!stripe) return { brand: 'visa', last4: '4242', expMonth: 12, expYear: new Date().getFullYear() + 2 };
    try {
      const pm = await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
      return cardDetails(pm);
    } catch (e) {
      asHttpError(e);
    }
  },

  async detachPaymentMethod(paymentMethodId: string): Promise<void> {
    if (!stripe) return;
    try {
      await stripe.paymentMethods.detach(paymentMethodId);
    } catch (e) {
      asHttpError(e);
    }
  },

  async setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    if (!stripe) return;
    try {
      await stripe.customers.update(customerId, { invoice_settings: { default_payment_method: paymentMethodId } });
    } catch (e) {
      asHttpError(e);
    }
  },
};
