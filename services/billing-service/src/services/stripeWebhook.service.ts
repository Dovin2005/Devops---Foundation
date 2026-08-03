import type Stripe from 'stripe';
import { paymentRepository } from '../repositories/billing.repository.js';
import { paymentMethodRepository } from '../repositories/paymentMethod.repository.js';
import { logger } from '../utils/logger.js';

// Reconciliation, not the primary source of truth — preauthorize()/capture()/
// cancel() and savePaymentMethod()/remove() already update local state
// synchronously from the Stripe API response. These handlers guard against
// drift (e.g. a card detached directly in the Stripe dashboard) and give the
// PaymentIntent lifecycle an async source of truth per Stripe's best practices.
async function onPaymentIntentSucceeded(intent: Stripe.PaymentIntent) {
  const payment = await paymentRepository.findByGatewayRef(intent.id);
  if (!payment || payment.status === 'captured') return;
  payment.status = intent.capture_method === 'manual' ? 'approved' : 'captured';
  await paymentRepository.save(payment);
}

async function onPaymentIntentFailed(intent: Stripe.PaymentIntent) {
  const payment = await paymentRepository.findByGatewayRef(intent.id);
  if (!payment || payment.status === 'declined') return;
  payment.status = 'declined';
  await paymentRepository.save(payment);
}

async function onPaymentMethodDetached(pm: Stripe.PaymentMethod) {
  const local = await paymentMethodRepository.findByStripeId(pm.id);
  if (local) await paymentMethodRepository.delete(local.id);
}

export const stripeWebhookService = {
  async handle(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        return onPaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
      case 'payment_intent.payment_failed':
        return onPaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
      case 'payment_method.detached':
        return onPaymentMethodDetached(event.data.object as Stripe.PaymentMethod);
      case 'payment_method.attached':
        return; // our attach flow already stores the card; nothing to reconcile
      default:
        logger.debug({ type: event.type }, 'unhandled stripe webhook event');
    }
  },
};
