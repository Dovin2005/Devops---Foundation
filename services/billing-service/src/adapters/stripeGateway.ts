import crypto from 'node:crypto';
import { stripe, stripeEnabled } from './stripeClient.js';
import { asHttpError } from './stripeErrors.js';

// Stripe card payments for appointment bookings. Pre-auth model: a manual-capture
// PaymentIntent authorizes the consult fee at booking time and is captured when
// the visit starts ("Charged when the visit starts" on the payment step).
//
// The client tokenizes the card with Stripe.js and sends a PaymentMethod id —
// raw card numbers never touch this backend. Without STRIPE_SECRET_KEY the
// adapter runs as a deterministic mock so local/dev flows work end to end.

export interface GatewayResult {
  gatewayRef: string; // PaymentIntent id
  status: 'approved' | 'declined';
}

const mockRef = (p: string) => `${p}_mock_${crypto.randomBytes(8).toString('hex')}`;

export const stripeGateway = {
  provider: stripeEnabled ? 'stripe' : 'mock',

  // Authorize without capturing. amountMinor is in the currency's minor unit
  // (cents / centavos).
  async preauthorize(input: {
    amountMinor: number;
    currency: 'usd' | 'cop';
    paymentMethodId?: string;
    customerId?: string; // Stripe Customer to attach the PaymentIntent to (saved-card reuse)
    setupFutureUsage?: boolean; // save the card on the customer for future off-session charges
    receiptEmail?: string | null;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<GatewayResult> {
    if (!stripe) return { gatewayRef: mockRef('pi'), status: 'approved' };
    try {
      const intent = await stripe.paymentIntents.create({
        amount: input.amountMinor,
        currency: input.currency,
        capture_method: 'manual',
        confirm: true,
        // Stripe's shared test PaymentMethod keeps Postman/dev flows one-shot.
        payment_method: input.paymentMethodId ?? 'pm_card_visa',
        customer: input.customerId,
        setup_future_usage: input.setupFutureUsage ? 'off_session' : undefined,
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
        receipt_email: input.receiptEmail ?? undefined,
        description: input.description,
        metadata: input.metadata,
      });
      return { gatewayRef: intent.id, status: intent.status === 'requires_capture' ? 'approved' : 'declined' };
    } catch (e) {
      asHttpError(e);
    }
  },

  // Capture a previous pre-auth (visit started).
  async capture(gatewayRef: string): Promise<GatewayResult> {
    if (!stripe) return { gatewayRef, status: 'approved' };
    try {
      const intent = await stripe.paymentIntents.capture(gatewayRef);
      return { gatewayRef: intent.id, status: intent.status === 'succeeded' ? 'approved' : 'declined' };
    } catch (e) {
      asHttpError(e);
    }
  },

  // Release a pre-auth (booking cancelled before the visit).
  async cancel(gatewayRef: string): Promise<GatewayResult> {
    if (!stripe) return { gatewayRef, status: 'approved' };
    try {
      const intent = await stripe.paymentIntents.cancel(gatewayRef);
      return { gatewayRef: intent.id, status: intent.status === 'canceled' ? 'approved' : 'declined' };
    } catch (e) {
      asHttpError(e);
    }
  },
};
