import { HttpError, INTERNAL_SECRET_HEADER } from '@ucc/service-kit';
import { env } from '../config/env.js';

const BASE = `${env.billingUrl}/api/billing/internal/bookings`;

async function call<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method: 'POST',
      headers: { 'content-type': 'application/json', [INTERNAL_SECRET_HEADER]: env.internalSecret },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000), // Stripe round-trip sits behind this call
    });
  } catch {
    throw new HttpError(502, 'billing-service unreachable');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new HttpError(res.status, (data as { message?: string })?.message ?? 'billing-service request failed');
  return (data as { data: T }).data;
}

export interface BookingPaymentDto {
  id: string;
  bookingId: string;
  type: string;
  provider: string;
  gatewayRef: string | null;
  status: string;
  amountUsd: string | null;
  amountCop: string;
  currency: string | null;
}

export interface BookingPreauthResult {
  payment: BookingPaymentDto;
  customerId: string | null;
}

export const billingClient = {
  // Pre-authorize the consult fee (captured when the visit starts).
  preauthorize: (body: {
    bookingId: string;
    patientId?: string | null;
    userId?: string | null;
    amountUsd: number;
    currency: 'usd' | 'cop';
    paymentMethodId?: string;
    savePaymentMethod?: boolean;
    customerEmail?: string | null;
    guestStripeCustomerId?: string | null;
    description?: string;
  }) => call<BookingPreauthResult>('/preauth', body),

  // Release a pre-auth when a booking is cancelled before the visit.
  cancel: (bookingId: string) => call<BookingPaymentDto>('/cancel', { bookingId }),
};
