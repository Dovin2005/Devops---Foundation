import { HttpError } from '@ucc/service-kit';
import { paymentRepository } from '../repositories/billing.repository.js';
import { paymentMethodRepository } from '../repositories/paymentMethod.repository.js';
import { getTrm, usdToCop } from '../config/trm.js';
import { stripeGateway } from '../adapters/stripeGateway.js';
import { stripeCustomers } from '../adapters/stripeCustomers.js';
import { paymentMethodsService } from './paymentMethods.service.js';
import type { Payment } from '../models/payment.model.js';

export interface BookingPreauthInput {
  bookingId: string;
  patientId?: string | null;
  userId?: string | null; // signed-in patient's users.id — resolves/creates their Stripe Customer
  amountUsd: number;
  currency: 'usd' | 'cop';
  paymentMethodId?: string;
  savePaymentMethod?: boolean; // attach + store the used card for future reuse
  customerEmail?: string | null;
  guestStripeCustomerId?: string | null; // reuse a guest's prior Stripe Customer (registration carryover)
  description?: string;
}

export interface BookingPreauthResult {
  payment: Payment;
  customerId: string | null;
}

const preauthKey = (bookingId: string) => `booking-${bookingId}-preauth`;

async function findPreauth(bookingId: string): Promise<Payment> {
  const p = await paymentRepository.findByIdemKey(preauthKey(bookingId));
  if (!p) throw new HttpError(404, 'No payment found for that booking');
  return p;
}

// Appointment payments: prices are quoted USD; COP is charged at the day's TRM.
// The pre-auth is captured when the visit starts and released on cancellation.
// Idempotency keys on the payments table guard double-charges on retries.
export const bookingPaymentsService = {
  async preauthorize(input: BookingPreauthInput): Promise<BookingPreauthResult> {
    // Resolve (never mint twice) the Stripe Customer this charge belongs to —
    // a registered user's persistent customer, or a guest's carried-forward one.
    let customerId: string | null = input.userId
      ? await paymentMethodsService.getOrCreateCustomer(input.userId)
      : (input.guestStripeCustomerId ?? null);

    const existing = await paymentRepository.findByIdemKey(preauthKey(input.bookingId));
    if (existing && existing.status !== 'declined') return { payment: existing, customerId }; // retry-safe

    if (!input.userId && !customerId) {
      customerId = await stripeCustomers.create({ email: input.customerEmail });
    }

    let paymentMethodId = input.paymentMethodId;
    if (input.userId && paymentMethodId) {
      const saved = await paymentMethodRepository.findByStripeId(paymentMethodId);
      if (saved && saved.userId !== input.userId) throw new HttpError(403, 'That payment method does not belong to you');
      if (!saved && input.savePaymentMethod) {
        await paymentMethodsService.savePaymentMethod(input.userId, paymentMethodId);
      }
    }

    const trm = await getTrm();
    const amountCop = usdToCop(input.amountUsd, trm);
    const amountMinor = input.currency === 'usd' ? Math.round(input.amountUsd * 100) : amountCop * 100;

    const res = await stripeGateway.preauthorize({
      amountMinor,
      currency: input.currency,
      paymentMethodId,
      customerId: customerId ?? undefined,
      setupFutureUsage: Boolean(input.userId && input.savePaymentMethod),
      receiptEmail: input.customerEmail,
      description: input.description ?? `UCC appointment ${input.bookingId}`,
      metadata: { bookingId: input.bookingId },
    });

    if (existing) {
      // Retrying after a decline — refresh the same row so the idempotency key
      // keeps pointing at the booking's single live pre-auth.
      const payment = await paymentRepository.save({
        ...existing,
        gatewayRef: res.gatewayRef,
        status: res.status,
        currency: input.currency,
        amountCop: amountCop.toFixed(2),
        amountUsd: input.amountUsd.toFixed(2),
      } as unknown as Payment);
      return { payment, customerId };
    }
    const payment = await paymentRepository.create({
      bookingId: input.bookingId,
      patientId: input.patientId ?? null,
      type: 'preauth',
      provider: stripeGateway.provider,
      amountCop: amountCop.toFixed(2),
      amountUsd: input.amountUsd.toFixed(2),
      currency: input.currency,
      gatewayRef: res.gatewayRef,
      idemKey: preauthKey(input.bookingId),
      status: res.status,
    });
    return { payment, customerId };
  },

  // Visit started → capture the held funds.
  async capture(bookingId: string): Promise<Payment> {
    const pre = await findPreauth(bookingId);
    if (pre.status === 'captured') return pre;
    if (pre.status !== 'approved') throw new HttpError(409, `Pre-authorization is ${pre.status}`);
    const res = await stripeGateway.capture(pre.gatewayRef ?? '');
    if (res.status !== 'approved') throw new HttpError(402, 'Capture failed');
    pre.status = 'captured';
    return paymentRepository.save(pre);
  },

  // Booking cancelled before the visit → release the hold.
  async cancel(bookingId: string): Promise<Payment> {
    const pre = await findPreauth(bookingId);
    if (pre.status === 'cancelled') return pre;
    if (pre.status !== 'approved') throw new HttpError(409, `Pre-authorization is ${pre.status}`);
    await stripeGateway.cancel(pre.gatewayRef ?? '');
    pre.status = 'cancelled';
    return paymentRepository.save(pre);
  },

  listForBooking(bookingId: string): Promise<Payment[]> {
    return paymentRepository.listByBooking(bookingId);
  },
};
